#!/usr/bin/env ruby
# 把刚上传的构建加入 TestFlight 测试组（App Store Connect REST API）
#
# 只用 Ruby 标准库（openssl / json / net/http），GitHub macOS runner 自带，
# 不需要 gem install fastlane，也不需要额外装任何东西。
#
# 环境变量：
#   ASC_KEY_PATH   .p8 私钥路径（仓库根目录下的 private_keys/AuthKey_XXX.p8）
#   ASC_KEY_ID     App Store Connect Key ID
#   ASC_ISSUER_ID  App Store Connect Issuer ID
#   BUNDLE_ID      如 com.yugusoft.bian
#   BUILD_NUMBER   本次构建的 CFBundleVersion（对应 API 里的 build version）
#   BETA_GROUP     测试组名；留空则用内部测试组（isInternalGroup，无需 Beta 审核）
#
# 说明：外部测试组需要过 Beta 审核，且 App 必须先填 betaAppReviewInfo
#（反馈邮箱、演示账号等），否则接口会拒绝。默认走内部组避开这个流程。

require 'openssl'
require 'base64'
require 'json'
require 'net/http'
require 'uri'
require 'time'

BASE = 'https://api.appstoreconnect.apple.com/v1'.freeze

def b64(str)
  Base64.urlsafe_encode64(str, padding: false)
end

# 把 BN 转成固定 32 字节的大端补码（ES256 的 r / s 各 32 字节）
def raw32(bn)
  bn.to_s(2).rjust(33, "\x00")[-32, 32]
end

# OpenSSL::PKey::EC#sign 返回的是 DER 编码的 ECDSA-Sig-Value（约 70~72 字节），
# 但 JWS 的 ES256 要求的是裸签名 r||s（固定 64 字节）。
# 直接把 DER 塞进去验签必失败，Apple 只会回 401 NOT_AUTHORIZED，看不出是这里的问题。
def der_to_raw(der)
  seq = OpenSSL::ASN1.decode(der)
  raw32(seq.value[0].value) + raw32(seq.value[1].value)
end

def jwt
  @jwt ||= begin
    key = OpenSSL::PKey::EC.new(File.read(ENV.fetch('ASC_KEY_PATH')))
    now = Time.now.to_i
    segments = [
      b64(JSON.generate(alg: 'ES256', kid: ENV.fetch('ASC_KEY_ID'), typ: 'JWT')),
      b64(JSON.generate(iss: ENV.fetch('ASC_ISSUER_ID'), iat: now, exp: now + 1200,
                        aud: 'appstoreconnect-v1'))
    ]
    signing_input = segments.join('.')
    signature = der_to_raw(key.sign(OpenSSL::Digest::SHA256.new, signing_input))
    # 自检：ES256 的裸签名必须是 64 字节，不是的话说明转换有问题，别等到被 401
    abort "JWT 签名长度异常（#{signature.bytesize} 字节，应为 64）" unless signature.bytesize == 64

    segments << b64(signature)
    token = segments.join('.')
    puts "JWT 已生成：kid=#{ENV.fetch('ASC_KEY_ID')} iss=#{ENV.fetch('ASC_ISSUER_ID')} 签名长度=64 字节"
    token
  end
end

def api(verb, path, body = nil)
  uri = URI.join("#{BASE}/", path)
  req = Net::HTTP.const_get(verb.capitalize).new(uri)
  req['Authorization'] = "Bearer #{jwt}"
  req['Content-Type'] = 'application/json'
  req.body = JSON.generate(body) if body
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 30, read_timeout: 60) do |http|
    http.request(req)
  end
  # 204（如加入测试组成功）没有 body，不能当成失败
  abort "App Store Connect API #{verb.upcase} #{path} 失败（HTTP #{res.code}）：#{res.body}" if res.code.to_i >= 300

  return {} if res.body.nil? || res.body.empty?

  JSON.parse(res.body)
end

bundle_id    = ENV.fetch('BUNDLE_ID')
build_number = ENV.fetch('BUILD_NUMBER')
group_name   = ENV['BETA_GROUP'].to_s.strip

# 1. 找到 App
app = api(:get, "apps?filter[bundleId]=#{bundle_id}").fetch('data').first
abort "找不到 bundleId=#{bundle_id} 的 App，确认 App Store Connect 里已创建" unless app
app_id = app.fetch('id')
puts "App：#{app.dig('attributes', 'name')} (#{app_id})"

# 2. 等 Apple 处理完二进位（PROCESSING 状态下不能加入测试组）
build = nil
40.times do |i|
  data = api(:get, "builds?filter[app]=#{app_id}&filter[version]=#{build_number}").fetch('data')
  build = data.first
  break if build && build.dig('attributes', 'processingState') != 'PROCESSING'

  state = build ? build.dig('attributes', 'processingState') : '尚未出现'
  puts "等待构建处理中…（#{state}，第 #{i + 1} 次查询，每 30 秒一次）"
  sleep 30
end

abort "构建 #{build_number} 一直没出现在 TestFlight，检查上传步骤是否真的成功" unless build

state = build.dig('attributes', 'processingState')
abort "构建处理失败（processingState=#{state}），去 App Store Connect 看具体原因" if state != 'VALID'
puts "构建：version=#{build.dig('attributes', 'version')} 已就绪（VALID）"

# 3. 找测试组：给了名字就按名字找，否则用内部测试组
groups = api(:get, "apps/#{app_id}/betaGroups").fetch('data')
group =
  if group_name.empty?
    groups.find { |g| g.dig('attributes', 'isInternalGroup') }
  else
    groups.find { |g| g.dig('attributes', 'name') == group_name }
  end

if group.nil?
  puts '现有测试组：' + groups.map { |g| g.dig('attributes', 'name') }.join('、')
  abort(group_name.empty? ? '没有内部测试组' : "找不到测试组「#{group_name}」，名字要和后台完全一致")
end

name = group.dig('attributes', 'name')
puts "测试组：#{name}#{group.dig('attributes', 'isInternalGroup') ? '（内部组，无需审核）' : '（外部组，可能需要 Beta 审核）'}"

# 4. 把构建加进测试组
api(:patch, "betaGroups/#{group.fetch('id')}/relationships/builds",
    data: [{ type: 'builds', id: build.fetch('id') }])

puts "完成：构建 #{build_number} 已加入「#{name}」，组内测试员可在 TestFlight 里更新"
