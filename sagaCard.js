// noinspection JSUnresolvedReference

class SagaCard extends NormalCard {
    drawCardText() {
        this.cardText = new Konva.Text({
            x: this.o.textStartX,
            y: this.typeArtSep.points()[1] + this.o.elemDistance,
            text: format_oracle(this.card.oracle_text),
            fontSize: this.o.oracleSize,
            fontFamily: "Open Sans",
            align: "left",
            lineHeight: 1.1,
            fill: 'black',
        })
    }

    async drawCardImage() {
        const imageStop = this.textBottomSep ? this.textBottomSep.points()[1] - this.o.borderOffset : this.o.H - 2 * this.o.borderOffset
        const max_height = imageStop - this.typeArtSep.points()[1] + this.o.elemDistance
        if (max_height > 0) {
            const imgLoadPromise = new Promise(resolve => {
                const imageObj = new Image();
                imageObj.onload = () => {
                    this.img = new Konva.Image({image: imageObj});

                    // change text width until it fits
                    const max_width = this.o.W - 4 * this.o.borderOffset
                    let current_width = max_width
                    while (this.cardText.width() > max_width || this.cardText.height() + 2 * this.o.borderOffset < max_height) {
                        this.cardText.width(current_width)
                        current_width = current_width - this.o.elemDistance
                    }

                    const available_width = this.o.W - 4 * this.o.borderOffset - this.cardText.width() - 2 * this.o.elemDistance

                    // until it doesn't fit, scale the image down
                    let currentScale = this.o.maxImageScale - 2 * this.o.minImageScale
                    while ((this.img.height() > max_height || this.img.width() >= available_width) && currentScale >= 0) {
                        this.img.width(this.o.textWidth * currentScale)
                        this.img.height(imageObj.height * (this.o.textWidth / imageObj.width) * currentScale)
                        currentScale = currentScale - this.o.scaleDecrement
                    }

                    // if it fits, center the art then move the text (and a separator) underneath it
                    if (this.img.height() <= max_height) {
                        this.img.x(this.o.W - 2 * this.o.borderOffset - this.img.width())
                        this.img.y(this.typeArtSep.points()[1] + (max_height - this.img.height() + this.o.elemDistance) / 2)
                        this.drawImgTextSep()
                    } else {
                        this.img = null
                    }
                    resolve();
                };
                imageObj.setAttribute('crossOrigin', 'anonymous');
                imageObj.src = this.getImageSrc()
            })
            // wait for the image to load
            await imgLoadPromise;
        }
    }

    drawImgTextSep() {
        this.imgTextSep = this.newSeparator({
            x1: this.img.x() - this.o.elemDistance,
            y1: this.typeArtSep.points()[1],
            x2: this.img.x() - this.o.elemDistance,
            y2: this.textBottomSep ? this.textBottomSep.points()[1] : this.o.H - 2 * this.o.borderOffset
        })
    }
}