import * as React from "react"
import { cn } from "@/lib/utils"

const FALLBACK_IMAGE_URL = "/ukart-logo.webp"

const ImageWrapper = React.forwardRef(({ aspectRatio, className, style, children }, ref) => (
  <span
    ref={ref}
    className={cn("inline-block relative", className)}
    style={{ aspectRatio, ...style }}
  >
    {children}
  </span>
))
ImageWrapper.displayName = "ImageWrapper"

const ResponsiveImage = React.forwardRef(
  ({ src, fittingType, className, style, aspectRatio, onLoad, ...props }, ref) => {
    return (
      <ImageWrapper ref={ref} aspectRatio={aspectRatio} className={className} style={style}>
        <img
          ref={ref}
          src={src}
          loading="lazy"
          className={cn(
            "w-full h-full inset-0 absolute",
            fittingType === "fit" ? "object-contain" : "object-cover"
          )}
          onLoad={onLoad}
          {...props}
        />
      </ImageWrapper>
    )
  }
)
ResponsiveImage.displayName = "ResponsiveImage"

const Image = React.forwardRef(
  (
    {
      src,
      fittingType = "fill",
      originWidth,
      originHeight,
      focalPointX,
      focalPointY,
      quality: _quality,
      ...props
    },
    ref
  ) => {
    const [imgSrc, setImgSrc] = React.useState(src)

    React.useEffect(() => {
      setImgSrc(src)
    }, [src])

    const imageProps = {
      ...props,
      onError: () => setImgSrc(FALLBACK_IMAGE_URL),
    }

    if (!src) {
      return <img ref={ref} src={FALLBACK_IMAGE_URL} {...imageProps} data-empty-image />
    }

    const isErrorUrl = imgSrc === FALLBACK_IMAGE_URL
    if (isErrorUrl) {
      return <img ref={ref} src={imgSrc} {...imageProps} data-error-image />
    }

    const aspectRatio =
      originWidth && originHeight ? `${originWidth} / ${originHeight}` : undefined

    return (
      <ResponsiveImage
        ref={ref}
        src={imgSrc}
        fittingType={fittingType}
        aspectRatio={aspectRatio}
        {...imageProps}
      />
    )
  }
)
Image.displayName = "Image"

export { Image }
