import { colors } from "@/theme/colors"

export type TileSize = "xs" | "sm" | "md" | "lg"

export type TileStyleProps = {
    primaryColor?: string,
    borderRadius?: number | string,
    paddingHorizontal?: number,
    paddingVertical?: number,
    marginRight?: number
}

type SizeStyles = {
    paddingHorizontal: number,
    paddingVertical: number,
    fontSize: number,
    borderRadius: number
}

const sizeStyles: Record<TileSize, SizeStyles> = {
    xs: { paddingHorizontal: 6, paddingVertical: 3, fontSize: 10, borderRadius: 6 },
    sm: { paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, borderRadius: 8 },
    md: { paddingHorizontal: 14, paddingVertical: 7, fontSize: 14, borderRadius: 10 },
    lg: { paddingHorizontal: 18, paddingVertical: 10, fontSize: 16, borderRadius: 12 }
}

export function getSizeStyles(size: TileSize = "md"): SizeStyles {
    return sizeStyles[size]
}

export function extractStyleProps(styleProps?: Partial<TileStyleProps>, size: TileSize = "md"): TileStyleProps & { fontSize: number } {
    const sizeDefaults = getSizeStyles(size)
    return {
        primaryColor: styleProps?.primaryColor ?? colors.accent,
        borderRadius: styleProps?.borderRadius ?? sizeDefaults.borderRadius,
        paddingHorizontal: styleProps?.paddingHorizontal ?? sizeDefaults.paddingHorizontal,
        paddingVertical: styleProps?.paddingVertical ?? sizeDefaults.paddingVertical,
        marginRight: styleProps?.marginRight ?? 8,
        fontSize: sizeDefaults.fontSize
    }
}
