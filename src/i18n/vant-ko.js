// Vant 2.10 does not ship a Korean pack. Match its complete locale contract.
export default {
  name: '이름', tel: '전화번호', save: '저장', confirm: '확인', cancel: '취소',
  delete: '삭제', complete: '완료', loading: '불러오는 중...',
  telEmpty: '전화번호를 입력해 주세요', nameEmpty: '이름을 입력해 주세요',
  nameInvalid: '이름 형식이 올바르지 않습니다', confirmDelete: '삭제하시겠습니까?',
  telInvalid: '전화번호 형식이 올바르지 않습니다',
  vanCalendar: {
    end: '종료', start: '시작', title: '달력', startEnd: '시작/종료',
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    monthTitle: (year, month) => `${year}년 ${month}월`,
    rangePrompt: maxRange => `${maxRange}일 이내로 선택해 주세요`
  },
  vanContactCard: { addText: '연락처 추가' },
  vanContactList: { addText: '새 연락처 추가' },
  vanPagination: { prev: '이전', next: '다음' },
  vanPullRefresh: { pulling: '아래로 당겨 새로고침...', loosing: '놓아서 새로고침...' },
  vanSubmitBar: { label: '합계:' },
  vanCoupon: {
    unlimited: '제한 없음', discount: discount => `${discount * 10}% 할인`,
    condition: condition => `${condition} 이상 구매 시`
  },
  vanCouponCell: { title: '쿠폰', tips: '쿠폰 없음', count: count => `쿠폰 ${count}장` },
  vanCouponList: {
    empty: '쿠폰 없음', exchange: '교환', close: '닫기', enable: '사용 가능',
    disabled: '사용 불가', placeholder: '쿠폰 코드'
  },
  vanAddressEdit: {
    area: '지역', postal: '우편번호', areaEmpty: '배송 지역을 선택해 주세요',
    addressEmpty: '주소를 입력해 주세요', postalEmpty: '우편번호가 올바르지 않습니다',
    defaultAddress: '기본 주소로 설정', telPlaceholder: '전화번호',
    namePlaceholder: '이름', areaPlaceholder: '지역'
  },
  vanAddressEditDetail: { label: '주소', placeholder: '주소' },
  vanAddressList: { add: '새 주소 추가' }
}
