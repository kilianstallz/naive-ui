import { defineComponent, h, PropType, computed } from 'vue'
import {
  hsl2hsv,
  hsl2rgb,
  hsla,
  hsv2hsl,
  hsv2rgb,
  hsva,
  rgb2hsl,
  rgb2hsv,
  rgba,
  toHexaString,
  toHslaString,
  toHsvaString,
  toRgbaString
} from 'seemly'
import { ColorPickerMode, getModeFromValue } from './utils'
import { warn } from '../../_utils'

// Try to normalize the color values to ensure that they are valid CSS colors
function normalizeColor (color: string, mode: ColorPickerMode | null): string {
  if (mode === 'hsv') {
    const [h, s, v, a] = hsva(color)
    return toRgbaString([...hsv2rgb(h, s, v), a])
  }
  // For the mode that is not in preset, we keep the original value.
  // For color names, they are legal to CSS, so we don’t deal with them,
  // and only standardize them when outputting.
  return color
}

function getHexFromName (color: string): string {
  const ctx = document
    .createElement('canvas')
    .getContext('2d') as CanvasRenderingContext2D
  ctx.fillStyle = color
  return ctx.fillStyle
}

const covert = {
  rgb: {
    hex (swatchValue: string): string {
      return toHexaString(rgba(swatchValue))
    },
    hsl (swatchValue: string): string {
      const [r, g, b, a] = rgba(swatchValue)
      return toHslaString([...rgb2hsl(r, g, b), a])
    },
    hsv (swatchValue: string): string {
      const [r, g, b, a] = rgba(swatchValue)
      return toHsvaString([...rgb2hsv(r, g, b), a])
    }
  },
  hex: {
    rgb (swatchValue: string): string {
      return toRgbaString(rgba(swatchValue))
    },
    hsl (swatchValue: string): string {
      const [r, g, b, a] = rgba(swatchValue)
      return toHslaString([...rgb2hsl(r, g, b), a])
    },
    hsv (swatchValue: string): string {
      const [r, g, b, a] = rgba(swatchValue)
      return toHsvaString([...rgb2hsv(r, g, b), a])
    }
  },
  hsl: {
    hex (swatchValue: string): string {
      const [h, s, l, a] = hsla(swatchValue)
      return toHexaString([...hsl2rgb(h, s, l), a])
    },
    rgb (swatchValue: string): string {
      const [h, s, l, a] = hsla(swatchValue)
      return toRgbaString([...hsl2rgb(h, s, l), a])
    },
    hsv (swatchValue: string): string {
      const [h, s, l, a] = hsla(swatchValue)
      return toHsvaString([...hsl2hsv(h, s, l), a])
    }
  },
  hsv: {
    hex (swatchValue: string): string {
      const [h, s, v, a] = hsva(swatchValue)
      return toHexaString([...hsv2rgb(h, s, v), a])
    },
    rgb (swatchValue: string) {
      const [h, s, v, a] = hsva(swatchValue)
      return toRgbaString([...hsv2rgb(h, s, v), a])
    },
    hsl (swatchValue: string): string {
      const [h, s, v, a] = hsva(swatchValue)
      return toHslaString([...hsv2hsl(h, s, v), a])
    }
  }
} as const

interface ParsedColor {
  value: string
  mode: ColorPickerMode | null
  legalValue: string
}

export default defineComponent({
  name: 'ColorPickerSwatches',
  props: {
    clsPrefix: {
      type: String,
      required: true
    },
    mode: {
      type: String as PropType<ColorPickerMode>,
      required: true
    },
    swatches: {
      type: Array as PropType<string[]>,
      required: true
    },
    onUpdateColor: {
      type: Function as PropType<(value: string) => void>,
      required: true
    }
  },
  setup (props) {
    const parsedSwatchesRef = computed<ParsedColor[]>(() =>
      props.swatches.map((value) => {
        const mode = getModeFromValue(value)
        return {
          value,
          mode,
          legalValue: normalizeColor(value, mode)
        }
      })
    )

    function normalizeOutput (parsed: ParsedColor): string {
      const { mode: modeProp } = props
      let { value, mode: swatchColorMode } = parsed
      if (swatchColorMode === modeProp) return value
      // color name is converted to hex
      if (!swatchColorMode) {
        swatchColorMode = 'hex'
        if (/^[a-zA-Z]+$/.test(value)) {
          value = getHexFromName(value)
        } else {
          // for invalid color, we make it black
          warn('color-picker', `color ${value} in swatches is invalid.`)
          value = '#000000'
        }
      }

      // swatch value to current mode value
      const conversions = covert[swatchColorMode]
      return (conversions as any)[modeProp](value)
    }

    function handleSwatchSelect (parsed: ParsedColor): void {
      props.onUpdateColor(normalizeOutput(parsed))
    }

    return {
      parsedSwatchesRef,
      handleSwatchSelect
    }
  },
  render () {
    const { clsPrefix } = this
    return (
      <div class={`${clsPrefix}-color-picker-swatches`}>
        {this.parsedSwatchesRef.map((swatch) => (
          <div
            class={`${clsPrefix}-color-picker-swatch`}
            onClick={() => this.handleSwatchSelect(swatch)}
          >
            <div
              class={`${clsPrefix}-color-picker-swatch__fill`}
              style={{ background: swatch.legalValue }}
            />
          </div>
        ))}
      </div>
    )
  }
})
