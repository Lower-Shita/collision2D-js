const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

class Circle {

    constructor (position, radius, color, colorCollision, matrix) {
        this.position = position
        this.radius = radius
        this.size = {w: this.radius * 2, h: this.radius*2}
        this.color = color
        this.colorCollision = colorCollision
        this.colorDraw = color
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.colorDraw
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
     this.colorDraw = color
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
        ctx.fillStyle = this.colorDraw
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

    function collisionCircles(c1, c2) {
        const dx = c1.position.x - c2.position.x
        const dy = c1.position.y - c2.position.y
        const distance = Math.hypot(dx, dy)
        return distance <= c1.radius + c2.radius
    }

    function projectPolygon(axis, polygon) {
        let min = Infinity
        let max = -Infinity

        for (const point of polygon) {
            const projection = point.x * axis.x + point.y * axis.y
            if (projection < min) min = projection
            if (projection > max) max = projection
        }

        return [min, max]
    }

    function collisionPolygons(p1, p2) {
    const polygons = [p1, p2]

    for (let i = 0; i < polygons.length; i++) {
        const polygon = polygons[i]

        for (let j = 0; j < polygon.length; j++) {
        const k = (j + 1) % polygon.length
        const edge = {
            x: polygon[k].x - polygon[j].x,
            y: polygon[k].y - polygon[j].y
        }

        // Axe perpendiculaire
        const axis = { x: -edge.y, y: edge.x }

        // Projette les 2 polygones sur cet axe
        const [minA, maxA] = projectPolygon(axis, p1)
        const [minB, maxB] = projectPolygon(axis, p2)

        // Test de séparation
        if (maxA < minB || maxB < minA) {
            return false // pas de collision
        }
        }
    }

    return true // collision détectée
    }



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
                    && object.position.y + object.radius <= subset.position.y + subset.size.h
                ) {

                    subset.items.push(object)

                }
            } else if (object.constructor.name === 'Polygon') {
                if (object.position.x >= subset.position.x
                    && object.position.x <= subset.position.x + subset.size.w 
                    && object.position.y >= subset.position.y 
                    && object.position.y <= subset.position.y + subset.size.h 
                    || object.position.x + object.size.w >= subset.position.x 
                    && object.position.x + object.size.w <= subset.position.x + subset.size.w 
                    && object.position.y + object.size.h >= subset.position.y 
                    && object.position.y + object.size.h <= subset.position.y + subset.size.h
                ) {
                    subset.items.push(object)
                }
            }
        })
        
        set.push(subset)
    }

    set.forEach(subset => {
        if (subset.items.length > 0) {

            let circles = []
            let polygons = []

            subset.items.forEach(element => {
                if (element.constructor.name === 'Circle') {
                    circles.push(element)
                } else if (element.constructor.name === 'Polygon') {
                    polygons.push(element)
                }
            })

            if (circles.length > 1) {
                for (let i = 0; i < circles.length - 1; i++) {
                    subset.items.forEach(element => {
                        
                        if (element !== subset.items[i] && collisionCircles(element, subset.items[i])) {
                            element.colorDraw = element.colorCollision
                        }
                    })
                }
            }

            if (polygons.length > 1) {
                for (let i = 0; i < polygons.length - 1; i++) {
                    subset.items.forEach(element => {
                        console.log(element !== subset.items[i])

                        if (element !== subset.items[i] && collisionPolygons(element.getAbsolutePoints(), subset.items[i].getAbsolutePoints())) {
                            element.colorDraw = element.colorCollision
                        }
                    })
                }
            }
            

        }
    })

    return set.forEach(element => {
        ctx.strokeRect(element.position.x, element.position.y, element.size.w, element.size.h)
    })

}

const C1 = new Circle({x: 250, y: 470}, 25, 'blue', 'red', undefined)
const C2 = new Circle({x: 300, y: 400}, 25, 'orange', 'red', undefined)
const C3 = new Circle({x: 250, y: 400}, 25, 'green', 'red', undefined)
const C4 = new Circle({x: 300, y: 470}, 25, 'pink', 'red', undefined)
const P1 = new Polygon({x: 300, y: 250}, [{x: 0, y: 50}, {x: 25, y: 0}, {x: 50, y: 50}], 'green', 'red', undefined)
const P2 = new Polygon({x: 340, y: 250}, [{x: 0, y: 50}, {x: 25, y: 0}, {x: 50, y: 50}], 'green', 'red', undefined)

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    collisionDetector([1400, 700], [7, 4], [C1, C2, C3, C4, P1, P2])
  
    C1.draw()
    C2.draw()
    C3.draw()
    C4.draw()
    P1.draw()
    P2.draw()
  
    // requestAnimationFrame(animate)
}
  
  
animate()