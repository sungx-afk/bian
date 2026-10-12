<template>
  <label class="language-selector" :class="{ 'language-selector--light': light }">
    <svg viewBox="0 0 24 24" class="language-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </svg>
    <span>{{ $t('语言') }}</span>
    <select :value="$locale" :aria-label="$t('选择语言')" @change="changeLanguage">
      <option v-for="language in languages" :key="language.code" :value="language.code" :lang="language.code">
        {{ language.name }}
      </option>
    </select>
  </label>
</template>

<script>
import { languages, setLocale } from '@/i18n'
export default {
  name: 'LanguageSelector',
  props: { light: Boolean },
  data() { return { languages } },
  methods: { changeLanguage(event) { setLocale(event.target.value) } }
}
</script>

<style scoped>
.language-selector {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  max-width: 100%;
  color: #684218;
  font-size: 14px;
}
.language-icon { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; }
.language-selector select {
  min-height: 48px;
  min-width: 100px;
  max-width: 180px;
  padding: 0 8px;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}
.language-selector select:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.language-selector select:active { background: rgba(130, 86, 33, 0.08); }
.language-selector option { color: #333; background: #fff; }
.language-selector--light { color: #f4ede3; }
</style>
