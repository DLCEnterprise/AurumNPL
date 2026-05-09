/** @type {import('@lhci/cli').LighthouseRc} */
module.exports = {
  ci: {
    collect: {
      // Run against the Vercel preview URL in CI, or localhost in dev.
      // Set LHCI_BUILD_CONTEXT__CURRENT_BRANCH and LHCI_GITHUB_TOKEN in CI env.
      url: [
        process.env.LHCI_URL || 'http://localhost:3000',
        process.env.LHCI_URL ? `${process.env.LHCI_URL}/signin` : 'http://localhost:3000/signin',
      ],
      numberOfRuns: 3,
      settings: {
        // Simulate a mid-range Android device on 4G — representative of
        // the least-capable device an institutional user might connect from.
        preset:             'desktop',
        throttlingMethod:   'simulate',
        throttling: {
          rttMs:                40,
          throughputKbps:       10240,
          cpuSlowdownMultiplier: 1,
        },
        // Skip auth-gated routes; test landing + signin only in CI.
        // For full dashboard testing, set up authenticated test users.
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },

    assert: {
      // Fail CI if any assertion is violated.
      preset: 'lighthouse:no-pwa',
      assertions: {

        /* ── Core Web Vitals ── */
        'largest-contentful-paint':    ['error',   { maxNumericValue: 2500  }],  // 2.5s
        'interaction-to-next-paint':   ['warn',    { maxNumericValue: 200   }],  // 200ms
        'cumulative-layout-shift':     ['error',   { maxNumericValue: 0.1   }],  // 0.1
        'first-contentful-paint':      ['warn',    { maxNumericValue: 1800  }],  // 1.8s
        'total-blocking-time':         ['warn',    { maxNumericValue: 200   }],  // 200ms TBT proxy for INP

        /* ── Scores ── */
        'categories:performance':       ['warn',   { minScore: 0.80 }],  // Warn below 80
        'categories:accessibility':     ['error',  { minScore: 0.90 }],  // Error below 90
        'categories:best-practices':    ['warn',   { minScore: 0.90 }],
        'categories:seo':               ['warn',   { minScore: 0.90 }],

        /* ── Resource weights ── */
        'total-byte-weight':            ['warn',   { maxNumericValue: 614400 }],  // 600KB total
        'unused-javascript':            ['warn',   { maxNumericValue: 51200  }],  // 50KB unused JS
        'render-blocking-resources':    ['error',  { maxNumericValue: 500    }],  // <500ms blocking

        /* ── Network ── */
        'uses-text-compression':        ['warn',   {}],  // Brotli/gzip must be on
        'uses-long-cache-ttl':          ['warn',   {}],  // Cache-Control headers required
        'uses-optimized-images':        ['warn',   {}],
        'uses-modern-image-formats':    ['warn',   {}],  // AVIF/WebP

        /* ── Accessibility — non-negotiable ── */
        'color-contrast':               ['error',  {}],
        'document-title':               ['error',  {}],
        'html-has-lang':                ['error',  {}],
        'label':                        ['error',  {}],
        'link-name':                    ['error',  {}],
        'button-name':                  ['error',  {}],
        'image-alt':                    ['error',  {}],

        /* ── Security headers ── */
        'is-on-https':                  ['error',  {}],
        'no-vulnerable-libraries':      ['error',  {}],
      },
    },

    upload: {
      // Store results in LHCI server or temporary public storage for PR comments.
      // Set LHCI_TOKEN in CI environment.
      target: 'temporary-public-storage',
    },
  },
}
