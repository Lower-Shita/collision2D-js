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

    function collisionPolygonCircle(polygon, circle) {
        const points = polygon
        const cx = circle.position.x
        const cy = circle.position.y
        const r = circle.radius
        const edges = []
        let boolean = false

        function getSize (points) {
            let ptsX = []
            let ptsY = []

            points.forEach(point => {
                ptsX.push(point.x)
                ptsY.push(point.y)
            })

            let pointXMin = Math.min(...ptsX)
            let pointXMax = Math.max(...ptsX)
            let pointYMin = Math.min(...ptsY)
            let pointYMax = Math.max(...ptsY)

            return {x: {min: pointXMin, max: pointXMax}, y: {min: pointYMin, max: pointYMax}}
        }

        // Construction des différentes arrêtes
        for (let i = 0; i < points.length; i++) {
            let edge = {}

            if (i < points.length - 1) {
                let a = points[i + 1].x - points[i].x
                let b = points[i + 1].y - points[i].y
                let xm = points[i].x + ((points[i + 1].x - points[i].x) / 2)
                let ym = points[i].y + ((points[i + 1].y - points[i].y) / 2)

                edge.points = [{x: points[i].x, y: points[i].y}, {x: points[i + 1].x, y: points[i + 1].y}]
                edge.dist = Math.hypot(a, b)
                edge.middle = {x: xm, y: ym}
                edge.size = getSize(edge.points)

                edges.push(edge)
            } else {
                let a = points[0].x - points[i].x
                let b = points[0].y - points[i].y
                let xm = points[0].x - ((points[0].x - points[i].x) / 2)
                let ym = points[0].y - ((points[0].y - points[i].y) / 2)

                edge.points = [{x: points[i].x, y: points[i].y}, {x: points[0].x, y: points[0].y}]
                edge.dist = Math.hypot(a, b)
                edge.middle = {x: xm, y: ym}
                edge.size = getSize(edge.points)

                edges.push(edge)
            }

        }

        for (edge of edges) {
            let a = circle.position.x - edge.middle.x
            let b = circle.position.y - edge.middle.y
            let hypotenuse = Math.hypot(a, b)
            let opposite = Math.sin(angleABC(circle.position.x, circle.position.y, edge.middle.x, edge.middle.y, edge.points[0].x, edge.points[0].y)) * hypotenuse

            function angleABC(ax, ay, bx, by, cx, cy) {
                const abx = ax - bx
                const aby = ay - by
                const cbx = cx - bx
                const cby = cy - by

                const dot = abx * cbx + aby * cby
                const magAB = Math.hypot(abx, aby)
                const magCB = Math.hypot(cbx, cby)

                const cosTheta = dot / (magAB * magCB)
                return Math.acos(cosTheta) // en radians
            }


            if (
                circle.position.x + circle.radius >= edge.size.x.min
                && circle.position.x - circle.radius <= edge.size.x.max
                && circle.position.y + circle.radius >= edge.size.y.min
                && circle.position.y - circle.radius <= edge.size.y.max
                && Math.abs(opposite) <= circle.radius
            ) {
                console.log(Math.abs(opposite))
                boolean = true 
                break
            } else {
                boolean = false
            }
        }

        return boolean
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
                    circles.forEach(circle => {
                        
                        if (circle !== circles[i] && collisionCircles(circle, circles[i])) {
                            circle.colorDraw = circle.colorCollision
                        }
                    })
                }
            }

            if (polygons.length > 0) {
                for (let i = 0; i < polygons.length; i++) {
                    subset.items.forEach(element => {

                        if (element.constructor.name === 'Polygon' && element !== polygons[i] && collisionPolygons(element.getAbsolutePoints(), polygons[i].getAbsolutePoints())) {
                            element.colorDraw = element.colorCollision
                        }

                        if (circles.length > 0) {
                            circles.forEach(circle => {
                                if (element.constructor.name === 'Polygon' && collisionPolygonCircle(element.getAbsolutePoints(), circle)) {
                                    element.colorDraw = element.colorCollision
                                }
                            })
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
const C4 = new Circle({x: 400, y: 300}, 25, 'pink', 'red', undefined)
const P1 = new Polygon({x: 100, y: 100}, [{x: 0, y: 50}, {x: 25, y: 0}, {x: 50, y: 50}], 'green', 'red', undefined)
const P2 = new Polygon({x: 420, y: 250}, [{x: 0, y: 100}, {x: 100, y: 0}, {x: 100, y: 100}], 'green', 'red', undefined)

document.addEventListener('mousemove', event => {
    C4.position.x = event.clientX
    C4.position.y = event.clientY
})

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    collisionDetector([1400, 700], [7, 4], [C1, C2, C3, C4, P1, P2])
  
    C1.draw()
    C2.draw()
    C3.draw()
    C4.draw()
    P1.draw()
    P2.draw()
  
    requestAnimationFrame(animate)
}
  
  
animate()