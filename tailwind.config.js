const plugin = require('tailwindcss/plugin');

const primaryColors = {
  primary: {
    1: '#1C3FAA',
    2: '#2e51bb',
    3: '#D32929',
    4: '#91C714',
    5: '#3160D8',
    6: '#F78B00',
    7: '#FBC500',
    8: '#3b5998',
    9: '#4ab3f4',
    10: '#517fa4',
    11: '#0077b5',
  },
  dark: {
    1: '#293145',
    2: '#232a3b',
    3: '#313a55',
    4: '#1e2533',
    5: '#3f4865',
    6: '#2b3348',
    7: '#181f29',
  },
  gray: {
    100: '#f7fafc',
    200: '#edf2f7',
    300: '#e2e8f0',
    400: '#cbd5e0',
    500: '#a0aec0',
    600: '#718096',
    700: '#4a5568',
    800: '#2d3748',
    900: '#1a202c',
  },
};

module.exports = {
  mode: 'jit',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app.tsx',
    './public/**/*.{html,js,jsx,ts,tsx}',
    './node_modules/@left4code/tw-starter/**/*.js',
    './dist/*.html',
    './src/stories/*.{js,jsx,ts,tsx}',
    './src/stories/*.stories.{js,jsx,ts,tsx}',
    './src/stories/*.{stories.js,stories.jsx,stories.ts,stories.tsx}',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...primaryColors,
        primary: {
          ...primaryColors.primary,
          1: '#142E71',
          DEFAULT: '#142E71',
        },
        dark: {
          ...primaryColors.dark,
          8: '#242b3c',
        },
        theme: {
          1: '#071A50',
          2: '#2D427B',
          3: '#A2AFD5',
          4: '#C6D4FD',
          5: '#D32929',
          6: '#365A74',
          7: '#D2DFEA',
          8: '#7F9EB8',
          9: '#96A5D0',
          10: '#13B176',
          11: '#11296d',
          12: '#1f377d',
          13: '#9BADE4',
          14: '#1c3271',
          15: '#F1F5F8',
          16: '#102867',
          17: '#142E71',
          18: '#172F71',
          19: '#B2BEDE',
          20: '#102765',
          21: '#3160D8',
          22: '#F78B00',
          23: '#FBC500',
          24: '#CE3131',
          25: '#E2EBF2',
          26: '#203f90',
          27: '#8DA9BE',
          28: '#607F96',
          29: '#B8F1E1',
          30: '#FFE7D9',
          31: '#DBDFF9',
          32: '#2B4286',
          33: '#8C9DCA',
          34: '#0E2561',
          35: '#E63B1F',
        },
      },
      spacing: { '30%': '30%' },
      fontFamily: {
        roboto: ['Roboto'],
      },
      container: {
        center: true,
      },
      minWidth: {
        24: '6rem',
      },
      maxWidth: {
        '1/4': '25%',
        '1/3': '33%',
        '1/2': '50%',
        '3/4': '75%',
      },
      screens: {
        xxs: '320px',
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        xxl: '1600px',
      },
      keyframes: {
        dropdownSlide: {
          '0%': { transform: 'translateY(0.5rem)' },
          '100%': { transform: 'translateY(0rem)' },
        },
        slideToRight: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },

        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(0%)',
            opacity: 0,
          },
        },
        chase: {
          '0%': {
            top: 0,
            left: 0,
          },

          '12.5%': {
            top: 0,
            left: '50%',
          },

          '25%': {
            top: 0,
            left: '50%',
          },

          '37.5%': {
            top: '50%',
            left: '50%',
          },

          '50%': {
            top: '50%',
            left: '50%',
          },

          '62.5%': {
            top: '50%',
            left: 0,
          },

          '75%': {
            top: '50%',
            left: 0,
          },

          '87.5%': {
            top: 0,
            left: 0,
          },

          '100%': {
            top: 0,
            left: 0,
          },
        },
        bounceHorizontal: {
          '0%, 100%': { transform: 'translateX(0.5rem)', opacity: 0 },
          '50%': { transform: 'translateX(0px)', opacity: 1 },
        },
      },
      animation: {
        dropdownSlide: 'dropdownSlide ease-in-out 0.3s',
        slideToRight: 'slideToRight ease-in 0.2s',
        wiggle: 'wiggle 0.5s ease-in-out infinite',
        bounceHorizontal: 'bounceHorizontal 1s ease-in infinite',
        chase: 'chase 2s linear infinite',
        shimmer: 'shimmer 2.5s ease-out infinite',
      },
      strokeWidth: {
        0.5: 0.5,
        1.5: 1.5,
        2.5: 2.5,
      },
    },
  },

  variants: {
    extend: {
      width: ['important'],
      borderWidth: ['responsive', 'last'],
      backgroundColor: [
        'label-checked',
        'last',
        'first',
        'odd',
        'responsive',
        'hover',
        'dark',
      ],
      borderColor: ['last', 'first', 'odd', 'responsive', 'hover', 'dark'],
      textColor: [
        'label-checked',
        'last',
        'first',
        'odd',
        'responsive',
        'hover',
        'dark',
      ],
      boxShadow: [
        'checked',
        'label-checked',
        'last',
        'first',
        'odd',
        'responsive',
        'hover',
        'dark',
      ],
      borderOpacity: ['last', 'first', 'odd', 'responsive', 'hover', 'dark'],
      borderRadius: ['checked', 'label-checked'],
      backgroundOpacity: [
        'last',
        'first',
        'odd',
        'responsive',
        'hover',
        'dark',
      ],
      display: ['group-focus', 'group-hover', 'first'],
      scale: [
        'active',
        'group-hover',
        'group-focus',
        'hover',
        'focus-within',
        'focus',
      ],
      zIndex: ['responsive', 'hover'],
      position: ['responsive', 'hover'],
      padding: ['responsive', 'last'],
      margin: ['responsive', 'last'],
      fontSize: ['hover'],
    },
  },
  plugins: [
    plugin(({ addVariant, e }) => {
      addVariant('label-checked', ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          const eClassName = e(`label-checked${separator}${className}`); // escape class
          const yourSelector = 'input[type="radio"]'; // your input selector. Could be any
          return `${yourSelector}:checked ~ .${eClassName}`; // ~ - CSS selector for siblings
        });
      });
    }),
    plugin(function ({ addVariant }) {
      addVariant('important', ({ container }) => {
        container.walkRules((rule) => {
          rule.selector = `.\\!${rule.selector.slice(1)}`;
          rule.walkDecls((decl) => {
            decl.important = true;
          });
        });
      });
    }),
  ],
};
