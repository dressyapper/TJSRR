class shadow {

    static speed = 15
    static roomdelay = 15
    image = "shadow.png"
    static hitboxsize = 350
    static sound = "shadow.mp3"

    roomnum = null
    id = null

    x = ctx.canvas.width/2
    y = ctx.canvas.height

    done = false
    
    foundplayer = false
    plrinhitbox = false

    size = 50

    constructor() {
        this.id = game.totalmonsters
        this.roomnum = player.room-this.constructor.roomdelay
        let spritesize = this.size
        let monster = this

        game.totalmonsters += 1
        if (!game.current[this.constructor.name]) {
            game.current[this.constructor.name] = 0
        }
        game.current[this.constructor.name] += 1

        async function forloop() {
            monster.roomnum = player.room-monster.constructor.roomdelay

            for ( let i = player.room-monster.constructor.roomdelay; i <= player.room+10;) {
                i++;
                monster.roomnum = i
                if (getWayPointsOfRoom(roomhistory[i]).length != 0) {
                    //room has waypoints

                    //this is used from the start to the first waypoint
                    await new Promise((resolve, reject) => {
                        let next = getWayPointsOfRoom(roomhistory[i])[0]
                        let current = getElementFromRoom(roomhistory[i], "start")
                        let distance = distanceFrom(current, next)
                        let j = 0
                        let loop = setInterval(() => {
                            if (j + 0.01 >= 1) {
                                j = 1
                                monster.roomnum = i
                                clearInterval(loop)
                                resolve()
                            }
                            
                            monster.x = lerp(current.x + current.w/2, next.x, j) 
                            monster.y =lerp(current.y + current.h/2, next.y, j) 
                            j += (monster.constructor.speed / distance);
                            monster.raycast()
                            monster.hitbox()
                            monster.loop()
                        },10)
                    }).then(async () => {
                        //this is used for the rest of the waypoints starting at moving from first waypoint 
                        for (let k = 0; k < getWayPointsOfRoom(roomhistory[i]).length; k++) {
                            let next = getWayPointsOfRoom(roomhistory[i])[k+1] || {x:getElementFromRoom(roomhistory[i], "end").x + getElementFromRoom(roomhistory[i], "end").w/2,y:getElementFromRoom(roomhistory[i], "end").y + getElementFromRoom(roomhistory[i], "end").h/2,}
                            let current = getWayPointsOfRoom(roomhistory[i])[k]
                            let distance = distanceFrom(current, next)
                            await new Promise((resolve, reject) => {
                                let j = 0
                                let loop = setInterval(() => {
                                    if (j + 0.01 >= 1 || (distance/100000) * monster.constructor.speed == 0) {
                                        j = 1
                                        clearInterval(loop)
                                        resolve()
                                    }
                                    
                                    monster.x = lerp(current.x, next.x, j) 
                                    monster.y = lerp(current.y, next.y, j) 
                                    
                                    j += (monster.constructor.speed / distance);
                                    //console.log(j, (distance/100000) * monster.constructor.speed)
                                    monster.raycast()
                                    monster.hitbox()
                                    monster.loop()
                                },10)
                            }).then(() => {
                                monster.roomnum = i
                            })
                        }

                    })

                }
                else {
                    //room has no waypoints, just go straight to the exit
                    await new Promise((resolve, reject) => {
                        let j = 0
                        let current
                        if (getElementFromRoom(roomhistory[i], "start") != null) {
                            current = getElementFromRoom(roomhistory[i], "start")
                        }
                        else {
                            current = {x: ctx.canvas.width/2, y: ctx.canvas.height}
                        }
                        let distance = distanceFrom((getElementFromRoom(roomhistory[i], "start") ? getElementFromRoom(roomhistory[i], "start") : null) || {x: ctx.canvas.width/2, y: ctx.canvas.height}, (getElementFromRoom(roomhistory[i], "end") ? getElementFromRoom(roomhistory[i], "end") : null) || {x: ctx.canvas.width/2, y: 0})
                        let loop = setInterval(() => {
                            if (j + 0.01 >= 1) {
                                j = 1
                                clearInterval(loop)
                                resolve()

                            }

                            
                            
                            monster.x = lerp((getElementFromRoom(roomhistory[i], "start")) ? getElementFromRoom(roomhistory[i], "start").x+getElementFromRoom(roomhistory[i], "start").w/2-spritesize/2 : ctx.canvas.width/2, (getElementFromRoom(roomhistory[i], "end")) ? getElementFromRoom(roomhistory[i], "end").x+getElementFromRoom(roomhistory[i], "end").w/2-spritesize/2 : ctx.canvas.width/2, j)
                            monster.y = lerp((getElementFromRoom(roomhistory[i], "start")) ? getElementFromRoom(roomhistory[i], "start").y : ctx.canvas.height, (getElementFromRoom(roomhistory[i], "end")) ? getElementFromRoom(roomhistory[i], "end").y+getElementFromRoom(roomhistory[i], "end").h/4 : 0, j)
                            j += (monster.constructor.speed / distance);
                            monster.raycast()
                            monster.hitbox()
                            monster.loop()
                        },10)
                    }).then(() => {
                        monster.roomnum = i
                    })
                }
            }
            monster.done = true
        }

        this.sound()
        forloop().then(() => {
            game.current[this.constructor.name] -= 1
            delete currentmonsters[this.id] 
            this.indicator()

        })


    }

    async loop() {
        if (player.maxroom > 0) {
            currentmonsters[this.id] = {x: this.x, y: this.y, size: this.size, roomnum: this.roomnum, img: this.image}
        }
        this.indicator()
        this.death()
        if (player.died) {this.ifdead()}
    }

    raycast() {
        let ray = {x:this.x, y:this.y}
        for (let i = 0; i <= 1; i+=0.01) {
            ray.x = lerp(this.x, player.x, i)
            ray.y = lerp(this.y, player.y, i)

            if (player.room == this.roomnum) {
                if (getObjectFromPoint(ray)) {
                    this.foundplayer = false
                    break
                }
                else if (distanceFrom(player, ray) < 10) {
                    this.foundplayer = true
                    continue
                }
            }



        }

    }

    hitbox() {
        if (distanceFrom(player, this) <= this.constructor.hitboxsize) {
            this.plrinhitbox = true
        }
        else {
            this.plrinhitbox = false
        }
    }
    
    death() {
        if (this.plrinhitbox && this.foundplayer && player.room == this.roomnum) {
            killplayer("shadow")
        }
    }

    ifdead() {
        this.done = true
        delete currentmonsters[this.id]
    }

    indicator() {
        if (!this.done) {
            let opacity = 100-distanceFrom({x: this.x+(500*Math.abs(player.room - this.roomnum)), y: this.y+(500*Math.abs(player.room - this.roomnum))}, player)/100
            let thing = () => {return {
                x: ctx.canvas.width/3 - 4,
                y: ctx.canvas.height/2.5,
                show: true,
                h: ctx.canvas.height,
                w: ctx.canvas.width,
                src: "shadowindicator.png",
                filter: "brightness(0%) opacity("+opacity+"%)",
            }}
            ui.shadowindicator = thing
        }
        else {
            ui.shadowindicator = () => {return {
                x: ctx.canvas.width/3 - 4,
                y: ctx.canvas.height/2.5,
                show: false,
                h: ctx.canvas.height,
                w: ctx.canvas.width,
                src: "shadowindicator.png",
                filter: "brightness(0%) opacity(0%)",
            }}
        }
    }

    sound() {
        const s = sound(this.constructor.sound, true)

        s.currentTime = 0
        s.loop = true
        s.play()

        let loop = setInterval(() => {
            if (this.done) {
                s.pause()
                s.currentTime = 0
                clearInterval(loop)
            }
        })
    }


}

class quaesitor {

    static speed = 2
    static roomdelay = 3
    image = "quaesitor1.png"
    static hitboxsize = 100

    roomnum = null
    id = null

    x = ctx.canvas.width/2
    y = ctx.canvas.height

    done = false
    
    foundplayer = false
    plrinhitbox = false

    seen = [false, null, null]

    size = 50

    constructor() {
        this.id = game.totalmonsters
        this.roomnum = player.room-this.constructor.roomdelay
        let spritesize = this.size
        let monster = this
        this.sprite()

        game.totalmonsters += 1
        if (!game.current[this.constructor.name]) {
            game.current[this.constructor.name] = 0
        }
        game.current[this.constructor.name] += 1

        async function forloop() {
            monster.roomnum = player.room-monster.constructor.roomdelay

            for ( let i = player.room-monster.constructor.roomdelay; i <= player.room+10;) {
                i++;
                monster.roomnum = i
                if (getWayPointsOfRoom(roomhistory[i]).length != 0) {
                    //room has waypoints

                    //this is used from the start to the first waypoint
                    await new Promise((resolve, reject) => {
                        let next = getWayPointsOfRoom(roomhistory[i])[0]
                        let current = getElementFromRoom(roomhistory[i], "start")
                        let distance = distanceFrom(current, next)
                        let j = 0
                        let loop = setInterval(() => {
                            if (j + 0.01 >= 1) {
                                j = 1
                                monster.roomnum = i
                                clearInterval(loop)
                                resolve()
                            }

                            
                            
                            monster.x = lerp(current.x + current.w/2, next.x, j) 
                            monster.y =lerp(current.y + current.h/2, next.y, j) 
                            j += (monster.constructor.speed / distance);
                            monster.raycast()
                            monster.hitbox()
                            monster.loop()
                        },10)
                    }).then(async () => {
                        //this is used for the rest of the waypoints starting at moving from first waypoint 
                        for (let k = 0; k < getWayPointsOfRoom(roomhistory[i]).length; k++) {
                            let next = getWayPointsOfRoom(roomhistory[i])[k+1] || {x:getElementFromRoom(roomhistory[i], "end").x + getElementFromRoom(roomhistory[i], "end").w/2,y:getElementFromRoom(roomhistory[i], "end").y + getElementFromRoom(roomhistory[i], "end").h/2,}
                            let current = getWayPointsOfRoom(roomhistory[i])[k]
                            let distance = distanceFrom(current, next)
                            await new Promise((resolve, reject) => {
                                let j = 0
                                let loop = setInterval(() => {
                                    if (j + 0.01 >= 1 || (distance/100000) * monster.constructor.speed == 0) {
                                        j = 1
                                        clearInterval(loop)
                                        resolve()
                                    }
                                    
                                    monster.x = lerp(current.x, next.x, j) 
                                    monster.y = lerp(current.y, next.y, j) 
                                    
                                    j += (monster.constructor.speed / distance);
                                    //console.log(j, (distance/100000) * monster.constructor.speed)
                                    monster.raycast()
                                    monster.hitbox()
                                    monster.loop()
                                },10)
                            }).then(() => {
                                monster.roomnum = i
                            })
                        }

                    })

                }
                else {
                    //room has no waypoints, just go straight to the exit
                    await new Promise((resolve, reject) => {
                        let j = 0
                        let current
                        if (getElementFromRoom(roomhistory[i], "start") != null) {
                            current = getElementFromRoom(roomhistory[i], "start")
                        }
                        else {
                            current = {x: ctx.canvas.width/2, y: ctx.canvas.height}
                        }
                        let distance = distanceFrom((getElementFromRoom(roomhistory[i], "start") ? getElementFromRoom(roomhistory[i], "start") : null) || {x: ctx.canvas.width/2, y: ctx.canvas.height}, (getElementFromRoom(roomhistory[i], "end") ? getElementFromRoom(roomhistory[i], "end") : null) || {x: ctx.canvas.width/2, y: 0})
                        let loop = setInterval(() => {
                            if (j + 0.01 >= 1) {
                                j = 1
                                clearInterval(loop)
                                resolve()

                            }
                            
                            monster.x = lerp((getElementFromRoom(roomhistory[i], "start")) ? getElementFromRoom(roomhistory[i], "start").x+getElementFromRoom(roomhistory[i], "start").w/2-spritesize/2 : ctx.canvas.width/2, (getElementFromRoom(roomhistory[i], "end")) ? getElementFromRoom(roomhistory[i], "end").x+getElementFromRoom(roomhistory[i], "end").w/2-spritesize/2 : ctx.canvas.width/2, j)
                            monster.y = lerp((getElementFromRoom(roomhistory[i], "start")) ? getElementFromRoom(roomhistory[i], "start").y : ctx.canvas.height, (getElementFromRoom(roomhistory[i], "end")) ? getElementFromRoom(roomhistory[i], "end").y+getElementFromRoom(roomhistory[i], "end").h/4 : 0, j)
                            j += (monster.constructor.speed / distance);
                            monster.raycast()
                            monster.hitbox()
                            monster.loop()
                        },10)
                    }).then(() => {
                        monster.roomnum = i
                    })
                }
            }

            monster.done = true
            return
        }

        forloop().then(() => {
            game.current[this.constructor.name] -= 1
            this.indicator()
            delete currentmonsters[this.id] 
        })


    }

    async loop() {
        if (player.maxroom > 0) {
            currentmonsters[this.id] = {x: this.x, y: this.y, size: this.size, roomnum: this.roomnum, img: this.image}
        }
        this.death()
        this.indicator()
        if (player.died) {this.ifdead()}
    }

    raycast() {
        let ray = {x:this.x, y:this.y}
        for (let i = 0; i <= 1; i+=0.01) {
            ray.x = lerp(this.x, player.x, i)
            ray.y = lerp(this.y, player.y, i)

            if (player.room == this.roomnum) {
                if (getObjectFromPoint(ray)) {
                    this.foundplayer = false
                    break
                }
                else if (distanceFrom(player, ray) < 10) {
                    this.foundplayer = true
                    continue
                }
            }



        }

    }

    hitbox() {
        if (distanceFrom(player, this) <= this.constructor.hitboxsize) {
            this.plrinhitbox = true
        }
        else {
            this.plrinhitbox = false
        }
    }

    sprite() {
        setInterval(() => {
            if (this.image == "quaesitor1.png") {
                this.image = "quaesitor2.png" 
            }
            else {
                this.image = "quaesitor1.png"
            }
        }, 500)
    }
    
    death() {
        if (this.plrinhitbox && player.room == this.roomnum) {
            killplayer("quaesitor")
        }
    }

    ifdead() {
        delete currentmonsters[this.id]
    }

    indicator() {
        let thing = () => {return {
            x: ctx.canvas.width/3 - 4,
            y: ctx.canvas.height/2.5,
            show: !this.done,
            h: ctx.canvas.height,
            w: ctx.canvas.width,
            src: "quaesitorindicator.png",
        }}
        console.log(thing().show)
        ui.quaesitorindicator = thing
    }


}


class him {

    static speed = 100
    static roomdelay = 10
    image = "quaesitor_angry.png"
    static hitboxsize = 500

    roomnum = null
    id = null

    done = false

    x = ctx.canvas.width/2
    y = ctx.canvas.height
    
    foundplayer = false
    plrinhitbox = false

    size = 50

    constructor() {
        this.id = game.totalmonsters
        this.roomnum = player.room-this.constructor.roomdelay
        let spritesize = this.size
        let monster = this

        game.totalmonsters += 1
        if (!game.current[this.constructor.name]) {
            game.current[this.constructor.name] = 0
        }
        game.current[this.constructor.name] += 1

        async function forloop() {
            monster.roomnum = player.room-monster.constructor.roomdelay

            for ( let i = player.room-monster.constructor.roomdelay; i <= player.room+10;) {
                i++;
                monster.roomnum = i
                if (getWayPointsOfRoom(roomhistory[i]).length != 0) {
                    //room has waypoints

                    //this is used from the start to the first waypoint
                    await new Promise((resolve, reject) => {
                        let next = getWayPointsOfRoom(roomhistory[i])[0]
                        let current = getElementFromRoom(roomhistory[i], "start")
                        let distance = distanceFrom(current, next)
                        let j = 0
                        let loop = setInterval(() => {
                            if (j + 0.01 >= 1) {
                                j = 1
                                monster.roomnum = i
                                clearInterval(loop)
                                resolve()
                            }

                            
                            
                            monster.x = lerp(current.x + current.w/2, next.x, j) 
                            monster.y =lerp(current.y + current.h/2, next.y, j) 
                            j += (monster.constructor.speed / distance);
                            monster.raycast()
                            monster.hitbox()
                            monster.loop()
                        },10)
                    }).then(async () => {
                        //this is used for the rest of the waypoints starting at moving from first waypoint 
                        for (let k = 0; k < getWayPointsOfRoom(roomhistory[i]).length; k++) {
                            let next = getWayPointsOfRoom(roomhistory[i])[k+1] || {x:getElementFromRoom(roomhistory[i], "end").x + getElementFromRoom(roomhistory[i], "end").w/2,y:getElementFromRoom(roomhistory[i], "end").y + getElementFromRoom(roomhistory[i], "end").h/2,}
                            let current = getWayPointsOfRoom(roomhistory[i])[k]
                            let distance = distanceFrom(current, next)
                            await new Promise((resolve, reject) => {
                                let j = 0
                                let loop = setInterval(() => {
                                    if (j + 0.01 >= 1 || (distance/100000) * monster.constructor.speed == 0) {
                                        j = 1
                                        clearInterval(loop)
                                        resolve()
                                    }
                                    
                                    monster.x = lerp(current.x, next.x, j) 
                                    monster.y = lerp(current.y, next.y, j) 
                                    
                                    j += (monster.constructor.speed / distance);
                                    //console.log(j, (distance/100000) * monster.constructor.speed)
                                    monster.raycast()
                                    monster.hitbox()
                                    monster.loop()
                                },10)
                            }).then(() => {
                                monster.roomnum = i
                            })
                        }

                    })

                }
                else {
                    //room has no waypoints, just go straight to the exit
                    await new Promise((resolve, reject) => {
                        let j = 0
                        let current
                        if (getElementFromRoom(roomhistory[i], "start") != null) {
                            current = getElementFromRoom(roomhistory[i], "start")
                        }
                        else {
                            current = {x: ctx.canvas.width/2, y: ctx.canvas.height}
                        }
                        let distance = distanceFrom((getElementFromRoom(roomhistory[i], "start") ? getElementFromRoom(roomhistory[i], "start") : null) || {x: ctx.canvas.width/2, y: ctx.canvas.height}, (getElementFromRoom(roomhistory[i], "end") ? getElementFromRoom(roomhistory[i], "end") : null) || {x: ctx.canvas.width/2, y: 0})
                        let loop = setInterval(() => {
                            if (j + 0.01 >= 1) {
                                j = 1
                                clearInterval(loop)
                                resolve()

                            }
                            
                            monster.x = lerp((getElementFromRoom(roomhistory[i], "start")) ? getElementFromRoom(roomhistory[i], "start").x+getElementFromRoom(roomhistory[i], "start").w/2-spritesize/2 : ctx.canvas.width/2, (getElementFromRoom(roomhistory[i], "end")) ? getElementFromRoom(roomhistory[i], "end").x+getElementFromRoom(roomhistory[i], "end").w/2-spritesize/2 : ctx.canvas.width/2, j)
                            monster.y = lerp((getElementFromRoom(roomhistory[i], "start")) ? getElementFromRoom(roomhistory[i], "start").y : ctx.canvas.height, (getElementFromRoom(roomhistory[i], "end")) ? getElementFromRoom(roomhistory[i], "end").y+getElementFromRoom(roomhistory[i], "end").h/4 : 0, j)
                            j += (monster.constructor.speed / distance);
                            monster.raycast()
                            monster.hitbox()
                            monster.loop()
                        },10)
                    }).then(() => {
                        monster.roomnum = i
                    })
                }
            }

            monster.done = true
            return
        }

        forloop().then(() => {
            monster.done = true
            game.current[this.constructor.name] -= 1
            delete currentmonsters[this.id] 
        })


    }

    async loop() {
        if (player.maxroom > 0) {
            currentmonsters[this.id] = {x: this.x, y: this.y, size: this.size, roomnum: this.roomnum, img: this.image}
        }
        this.death()
        if (player.died) {this.ifdead()}
    }

    raycast() {
        let ray = {x:this.x, y:this.y}
        for (let i = 0; i <= 1; i+=0.01) {
            ray.x = lerp(this.x, player.x, i)
            ray.y = lerp(this.y, player.y, i)

            if (player.room == this.roomnum) {
                if (getObjectFromPoint(ray)) {
                    this.foundplayer = false
                    break
                }
                else if (distanceFrom(player, ray) < 10) {
                    this.foundplayer = true
                    continue
                }
            }



        }

    }

    hitbox() {
        if (distanceFrom(player, this) <= this.constructor.hitboxsize) {
            this.plrinhitbox = true
        }
        else {
            this.plrinhitbox = false
        }
    }
    
    death() {
        if (this.plrinhitbox && this.foundplayer && player.room == this.roomnum) {
            killplayer("him")
        }
    }

    ifdead() {
        delete currentmonsters[this.id]
    }


}

