(() => {
  'use strict'

  const root = document.documentElement
  const $ = (selector, scope = document) => scope.querySelector(selector)
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector))

  /* ------------------------------- Theme state ------------------------------ */

  const PRESETS = {
    red: { accent: '#ff3d63', accent2: '#ff7a45', name: 'Neon Red' },
    ice: { accent: '#38bdf8', accent2: '#6366f1', name: 'Ice' },
    lime: { accent: '#a3e635', accent2: '#22d3ee', name: 'Lime' },
    violet: { accent: '#a855f7', accent2: '#ec4899', name: 'Violet' },
    gold: { accent: '#fbbf24', accent2: '#f97316', name: 'Gold' },
    mono: { accent: '#e5e7eb', accent2: '#9ca3af', name: 'Mono' }
  }

  const DEFAULTS = {
    preset: 'red',
    accent: '#ff3d63',
    accent2: '#ff7a45',
    bg: 'aurora',
    glass: 64,
    radius: 18,
    gradient: true,
    noise: true
  }

  const STORAGE_KEY = 'str-website-theme-v1'
  let state = { ...DEFAULTS }

  const hexToRgb = (hex) => {
    const clean = String(hex || '').replace('#', '')
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
    const value = Number.parseInt(full, 16)
    if (!Number.isFinite(value)) return '255, 61, 99'
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`
  }

  const loadTheme = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...DEFAULTS }
      const saved = JSON.parse(raw)
      return {
        ...DEFAULTS,
        ...saved,
        glass: Math.max(0, Math.min(100, Number(saved.glass ?? DEFAULTS.glass))),
        radius: Math.max(0, Math.min(28, Number(saved.radius ?? DEFAULTS.radius)))
      }
    } catch {
      return { ...DEFAULTS }
    }
  }

  const saveTheme = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage can be disabled — the site still works for this session.
    }
  }

  const applyTheme = ({ save = true } = {}) => {
    root.style.setProperty('--accent', state.accent)
    root.style.setProperty('--accent-2', state.accent2)
    root.style.setProperty('--accent-rgb', hexToRgb(state.accent))
    root.style.setProperty('--accent2-rgb', hexToRgb(state.accent2))
    root.style.setProperty('--glass', String(state.glass / 100))
    root.style.setProperty('--radius', `${state.radius}px`)
    root.style.setProperty('--radius-sm', `${Math.max(8, state.radius - 4)}px`)
    root.dataset.bg = state.bg
    root.dataset.noise = state.noise ? 'on' : 'off'
    root.dataset.gradient = state.gradient ? 'on' : 'off'

    const meta = $('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', state.accent)

    const activePreset = PRESETS[state.preset] ? state.preset : null
    $$('[data-preset]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.preset === activePreset)
    })

    $$('.theme-preset[data-preset]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.preset === activePreset)
    })

    $$('[data-bg-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.bgMode === state.bg)
    })

    const accentInput = $('#accent-input')
    const accent2Input = $('#accent2-input')
    if (accentInput) accentInput.value = state.accent
    if (accent2Input) accent2Input.value = state.accent2

    const glassRange = $('#glass-range')
    const radiusRange = $('#radius-range')
    if (glassRange) glassRange.value = String(state.glass)
    if (radiusRange) radiusRange.value = String(state.radius)
    const glassValue = $('[data-value="glass"]')
    const radiusValue = $('[data-value="radius"]')
    if (glassValue) glassValue.textContent = `${state.glass}%`
    if (radiusValue) radiusValue.textContent = `${state.radius}px`

    const gradientToggle = $('#gradient-toggle')
    const noiseToggle = $('#noise-toggle')
    if (gradientToggle) gradientToggle.checked = state.gradient
    if (noiseToggle) noiseToggle.checked = state.noise

    if (save) saveTheme()
  }

  const setPreset = (id, notify = true) => {
    const preset = PRESETS[id]
    if (!preset) return
    state = {
      ...state,
      preset: id,
      accent: preset.accent,
      accent2: preset.accent2
    }
    applyTheme()
    if (notify) showToast(`Тема «${preset.name}» применена`)
  }

  /* ------------------------------- Theme panel ------------------------------ */

  const panel = $('#theme-panel')
  const fab = $('.theme-fab')

  const setPanel = (open) => {
    if (!panel) return
    panel.classList.toggle('is-open', open)
    panel.setAttribute('aria-hidden', open ? 'false' : 'true')
    if (fab) fab.classList.toggle('is-hidden', open)
    if (open) {
      const first = panel.querySelector('button, input')
      window.setTimeout(() => first?.focus({ preventScroll: true }), 120)
    }
  }

  $$('[data-open-theme]').forEach((button) => {
    button.addEventListener('click', () => setPanel(true))
  })
  $$('[data-close-theme]').forEach((button) => {
    button.addEventListener('click', () => setPanel(false))
  })
  if (fab) fab.addEventListener('click', () => setPanel(true))

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel?.classList.contains('is-open')) {
      setPanel(false)
      fab?.focus({ preventScroll: true })
    }
  })

  document.addEventListener('click', (event) => {
    const preset = event.target.closest('[data-preset]')
    if (preset) {
      setPreset(preset.dataset.preset)
      return
    }
    const bg = event.target.closest('[data-bg-mode]')
    if (bg) {
      state = { ...state, bg: bg.dataset.bgMode }
      applyTheme()
      return
    }
  })

  $('#accent-input')?.addEventListener('input', (event) => {
    state = { ...state, preset: 'custom', accent: event.target.value }
    applyTheme()
  })
  $('#accent2-input')?.addEventListener('input', (event) => {
    state = { ...state, preset: 'custom', accent2: event.target.value }
    applyTheme()
  })
  $('#glass-range')?.addEventListener('input', (event) => {
    state = { ...state, glass: Number(event.target.value) }
    applyTheme()
  })
  $('#radius-range')?.addEventListener('input', (event) => {
    state = { ...state, radius: Number(event.target.value) }
    applyTheme()
  })
  $('#gradient-toggle')?.addEventListener('change', (event) => {
    state = { ...state, gradient: event.target.checked }
    applyTheme()
  })
  $('#noise-toggle')?.addEventListener('change', (event) => {
    state = { ...state, noise: event.target.checked }
    applyTheme()
  })
  $('#theme-reset')?.addEventListener('click', () => {
    state = { ...DEFAULTS }
    applyTheme()
    showToast('Настройки темы сброшены')
  })

  /* ------------------------------- Showcase -------------------------------- */

  const SHOTS = {
    home: {
      title: 'Главная',
      heading: 'Главная',
      copy: 'Активная сборка, 3D-скин, время игры и память — всё на одном экране.',
      alt: 'Главный экран Street Launcher'
    },
    modpacks: {
      title: 'Готовые сборки',
      heading: 'Готовые сборки',
      copy: 'Каталог Modrinth с фильтрами по версии и загрузчику. Установка в один клик.',
      alt: 'Каталог готовых сборок в Street Launcher'
    },
    friends: {
      title: 'Друзья',
      heading: 'Друзья',
      copy: 'Кто в сети, у кого запущен Minecraft и что за сборка — без лишних вопросов.',
      alt: 'Экран друзей в Street Launcher'
    }
  }

  const showcaseImage = $('#showcase-image')
  const shotTitle = $('#shot-title')
  const showcaseHeading = $('#showcase-heading')
  const showcaseCopy = $('#showcase-copy')

  Object.values(SHOTS).forEach((shot) => {
    const image = new Image()
    image.src = `assets/shots/${shot.title === 'Главная' ? 'home' : shot.title === 'Друзья' ? 'friends' : 'modpacks'}.png`
  })

  $$('.showcase-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const shot = SHOTS[tab.dataset.shot]
      if (!shot || !showcaseImage) return
      $$('.showcase-tab').forEach((item) => {
        item.classList.toggle('is-active', item === tab)
        item.setAttribute('aria-selected', item === tab ? 'true' : 'false')
      })
      showcaseImage.style.opacity = '0.25'
      window.setTimeout(() => {
        showcaseImage.src = `assets/shots/${tab.dataset.shot}.png`
        showcaseImage.alt = shot.alt
        showcaseImage.style.opacity = '1'
      }, 110)
      if (shotTitle) shotTitle.textContent = shot.title
      if (showcaseHeading) showcaseHeading.textContent = shot.heading
      if (showcaseCopy) showcaseCopy.textContent = shot.copy
    })
  })

  /* ------------------------------- Mobile menu ------------------------------ */

  const menuButton = $('[data-menu]')
  const nav = $('.main-nav')

  menuButton?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open')
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false')
  })

  $$('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      nav?.classList.remove('is-open')
      menuButton?.setAttribute('aria-expanded', 'false')
    })
  })

  document.addEventListener('click', (event) => {
    if (!nav?.classList.contains('is-open')) return
    if (nav.contains(event.target) || menuButton?.contains(event.target)) return
    nav.classList.remove('is-open')
    menuButton?.setAttribute('aria-expanded', 'false')
  })

  /* ------------------------------- Topbar / reveal ------------------------------ */

  const topbar = $('#topbar')
  const onScroll = () => {
    topbar?.classList.toggle('is-scrolled', window.scrollY > 14)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const revealItems = $$('.reveal')
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'))
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' }
    )
    revealItems.forEach((item) => observer.observe(item))
  }

  /* ------------------------------- Toast -------------------------------- */

  let toastTimer = null
  function showToast(text) {
    const toast = $('#toast')
    if (!toast) return
    toast.textContent = text
    toast.classList.add('is-visible')
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400)
  }

  /* ------------------------------- Start -------------------------------- */

  state = loadTheme()
  applyTheme({ save: false })

  const hash = window.location.hash.replace('#', '')
  if (hash === 'themes') {
    window.setTimeout(() => setPanel(true), 420)
  }
})()
