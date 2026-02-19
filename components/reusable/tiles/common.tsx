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
    xs: { paddingHorizontal: 5, paddingVertical: 2, fontSize: 10, borderRadius: 8 },
    sm: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, borderRadius: 12 },
    md: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, borderRadius: 16 },
    lg: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderRadius: 20 }
}

export function getSizeStyles(size: TileSize = "md"): SizeStyles {
    return sizeStyles[size]
}

export function extractStyleProps(styleProps?: Partial<TileStyleProps>, size: TileSize = "md"): TileStyleProps & { fontSize: number } {
    const sizeDefaults = getSizeStyles(size)
    return {
        primaryColor: styleProps?.primaryColor ?? "#3b82f6",
        borderRadius: styleProps?.borderRadius ?? sizeDefaults.borderRadius,
        paddingHorizontal: styleProps?.paddingHorizontal ?? sizeDefaults.paddingHorizontal,
        paddingVertical: styleProps?.paddingVertical ?? sizeDefaults.paddingVertical,
        marginRight: styleProps?.marginRight ?? 8,
        fontSize: sizeDefaults.fontSize
    }
}