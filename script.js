const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

class Circle {

    constructor (position, radius, color, colorCollision, matrix) {
        this.position = position
        this.radius = radius
        this.size = {w: this.radius * 2, h: this.radius*2}
        this.color = color
        this.colorCollision = colorCollision
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.closePath()
    }

}

class Polygon {

  constructor (position, points, color, colorCollision, matrix) {
     this.position = position
     this.points = points // tableau de points relatifs [{x, y}, ...]
     this.color = color
     this.colorCollision = colorCollision
  }

  getAbsolutePoints() {
        return this.points.map(p => ({
            x: p.x + this.position.x,
            y: p.y + this.position.y
        }))
  }

  draw() {
        const pts = this.getAbsolutePoints()

        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y)
        }
        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
  }

  get size () {
    let ptsX = []
    let ptsY = []

    this.points.forEach(point => {
        ptsX.push(point.x)
        ptsY.push(point.y)
    })

    let pointXMin = Math.min(...ptsX)
    let pointXMax = Math.max(...ptsX)
    let pointYMin = Math.min(...ptsY)
    let pointYMax = Math.max(...ptsY)

    return {w: pointXMax - pointXMin, h: pointYMax - pointYMin}
  }

}

function collisionDetector (mapSize, subsetDivision, objects) {

    let set = []
    let subsets = subsetDivision[0] * subsetDivision[1]
    let subsetSize = {w: mapSize[0] / subsetDivision[0], h: mapSize[1] / subsetDivision[1]}

    for (let i = 0; i < subsets; i++) {
        let multiplyY = 0
        let multiplyX = i
        if (i == 7 || i == 14 || i == 21) {multiplyX = 0} else if (i == 8 || i == 15 || i == 22) {multiplyX = 1} else if (i == 9 || i == 16 || i == 23) {multiplyX = 2} else if (i == 10 || i == 17 || i == 24) {multiplyX = 3} else if (i == 11 || i == 18 || i == 25) {multiplyX = 4} else if (i == 12 || i == 19 || i == 26) {multiplyX = 5} else if (i == 13 || i == 20 || i == 27) {multiplyX = 6} else if (i == 14 || i == 21 || i == 28) {multiplyX = 7}
        if (i >= 7 && i < 14) {multiplyY = 1} else if (i >= 14 && i < 21) {multiplyY = 2} else if (i >= 21) {multiplyY = 3}
        let subset = {
            position: {x: subsetSize.w * multiplyX, y: subsetSize.h * multiplyY},
            size: subsetSize,
            items: []
        }

        objects.forEach(object => {
            if (object.constructor.name === 'Circle') {
                if (object.position.x - object.radius >= subset.position.x 
                && object.position.x - object.radius <= subset.position.x + subset.size.w 
                && object.position.y - object.radius >= subset.position.y 
                && object.position.y - object.radius <= subset.position.y + subset.size.h 
                || object.position.x + object.radius >= subset.position.x 
                && object.position.x + object.radius <= subset.position.x + subset.size.w 
                && object.position.y + object.radius >= subset.position.y 
                && object.position.y + object.radius <= subset.position.y + subset.size.h) {

                    subset.items.push(object)

                }
            }
        })
        
        set.push(subset)
    }
    console.log(set)

    return set.forEach(element => {
        ctx.strokeRect(element.position.x, element.position.y, element.size.w, element.size.h)
    })

}

const C1 = new Circle({x: 200, y: 400}, 25, 'blue', 'red', undefined)
const C2 = new Circle({x: 600, y: 400}, 25, 'orange', 'red', undefined)
const P1 = new Polygon({x: 300, y: 300}, [{x: 0, y: 50}, {x: 25, y: 0}, {x: 50, y: 50}], 'green', 'red', undefined)

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    collisionDetector([1400, 700], [7, 4], [C1, C2])
  
    C1.draw()
    C2.draw()
    P1.draw()
  
    // requestAnimationFrame(animate)
}
  
  
animate()