/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Montserrat', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			'brand-primary':  'hsl(var(--brand-primary))',
  			'brand-accent':   'hsl(var(--brand-accent))',
  			'brand-bg':       'hsl(var(--brand-bg))',
  			'cobalt':         'hsl(var(--cobalt))',
  			'navy':           'hsl(var(--navy))',
  			'cyan-electric':  'hsl(var(--cyan-electric))',
  			'titanium':       'hsl(var(--titanium))',
  			'ocre':           'hsl(var(--ocre))',
  			'magenta':        'hsl(var(--magenta))',
  			'action-save':    'hsl(var(--action-save))',
  			'action-save-foreground': 'hsl(var(--action-save-foreground))',
  			status: {
  				positive: 'hsl(var(--status-positive))',
  				attention: 'hsl(var(--status-attention))',
  				critical: 'hsl(var(--status-critical))',
  				neutral: 'hsl(var(--status-neutral))',
  			},
  			heatmap: {
  				'0': 'hsl(var(--heatmap-0))',
  				'1': 'hsl(var(--heatmap-1))',
  				'2': 'hsl(var(--heatmap-2))',
  				'3': 'hsl(var(--heatmap-3))',
  				'4': 'hsl(var(--heatmap-4))',
  				'5': 'hsl(var(--heatmap-5))',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    'text-brand-primary', 'text-brand-accent', 'bg-brand-primary', 'bg-brand-accent',
    'border-brand-primary', 'border-brand-accent', 'bg-brand-bg',
    'text-cobalt', 'bg-cobalt', 'border-cobalt',
    'text-navy', 'bg-navy', 'border-navy',
    'text-cyan-electric', 'bg-cyan-electric', 'border-cyan-electric',
    'text-titanium', 'bg-titanium', 'border-titanium',
    'text-ocre', 'bg-ocre', 'border-ocre',
    'text-magenta', 'bg-magenta', 'border-magenta',
    'bg-status-positive', 'text-status-positive', 'border-status-positive',
    'bg-status-attention', 'text-status-attention', 'border-status-attention',
    'bg-status-critical', 'text-status-critical', 'border-status-critical',
    'bg-status-neutral', 'text-status-neutral', 'border-status-neutral',
    'bg-status-positive/15', 'bg-status-attention/15', 'bg-status-critical/15', 'bg-status-neutral/15',
    'bg-status-positive/30', 'bg-status-attention/30', 'bg-status-critical/30', 'bg-status-neutral/30',
    'text-status-positive', 'text-status-attention', 'text-status-critical', 'text-status-neutral',
    'bg-action-save', 'hover:bg-action-save/90', 'text-action-save-foreground',
    'bg-heatmap-0', 'bg-heatmap-1', 'bg-heatmap-2', 'bg-heatmap-3', 'bg-heatmap-4', 'bg-heatmap-5',
    'text-heatmap-0', 'text-heatmap-1', 'text-heatmap-2', 'text-heatmap-3', 'text-heatmap-4', 'text-heatmap-5',
    'border-heatmap-1', 'border-heatmap-2', 'border-heatmap-3', 'border-heatmap-4', 'border-heatmap-5',
  ],
}