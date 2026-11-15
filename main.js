//add quaesitor indicator
//shadow sound
//quaestiro movement
//montre

let ctx
let canvas

let savefile = {
    deaths: {
        
    }
}

let player = {
    x: 50,
    y: 50,
    //size: 25,
    size: 50,
    speed: 10,
    died: false,
    sprint: {
        maxsprint: 100,
        sprint: 1,
        lost: 1,
    },
    collided: false,
    currentkeys: [],
    room: -1,
    maxroom: -1,
}

let game = {
    totalmonsters: 0,
    current: {},
    dialog: {
        on: false,
        text: "",
    },
    deathtext: ""
}

let settings = {
    roomhistorylength: 10,
}

let room = {
    start: null,
    end: null,
    map:[],
    deco:[],
    extra:[],
    waypoint:[],
}

//please when is the ui editor

function getuibyid(id) {
    for (i in ui) {
        if (ui[i]().id == id) {
            return id
        }
    }
}
let ui = [
    //roomnumbackground
    () => {return {
        x: ctx.canvas.width-140,
        y: ctx.canvas.height - 95,
        show: true,
        w:100,
        h:45,
        color: "rgb(193, 255, 100)",
        layer: 0,
    }},

    //roomnum
    () => {return {
        x: ctx.canvas.width-120,
        y: ctx.canvas.height - 65,
        w:50,
        h:25,
        size:24,
        show: true,
        text: player.room,
        color: "rgb(0, 0, 0)",
        layer: 1,
    }},

    //dialogbackground
    () => {return {
        id: "dialogbackground",
        x: player.x - 100,
        y: player.y - 150,
        show: game.dialog.on,
        w:200,
        h:100,
        color: "rgba(0, 0, 0, 0.76)",
        layer: 2,
    }},

    //dialog
    () => {
        let u = {
            x: player.x - 95,
            y: player.y - 130,
            show: game.dialog.on,
            size: 20,
            maxwidth: getuibyid("dialogbackground").w-10,
            text: game.dialog.text,
            color: "rgb(255, 255, 255)",
            layer:3,
        }
        return u
    },

    //shadowindicator
    () => {return {
        x: ctx.canvas.width/3 - 4,
        y: ctx.canvas.height/2.5,
        show: true,
        h: ctx.canvas.height,
        w: ctx.canvas.width,
        src: "shadowindicator.png",
        filter: "brightness(0%) opacity(0%)",
        layer: 4,
    }},

    //quaesitorindicator
    () => {return {
        x: 0,
        y: 0,
        show: true,
        h: 1,
        w: 1,
        src: "quaesitorindicator.png",
        filter: "none",
        layer: 5,
    }},

    //deathscreen
    () => {return {
        x: 0,
        y:0,
        show: player.died,
        h: ctx.canvas.height,
        w: ctx.canvas.width,
        filter: "none",
        color: "rgb(0, 0, 0)",
        layer: 1400000,
    }},

    //deathtext
    () => {
        let u = {
            x: ctx.canvas.width/2,
            y: ctx.canvas.height/2,
            show: player.died,
            size: 20,
            text: game.deathtext,
            color: "rgb(255, 255, 255)",
            align: "center",
            layer: 1400001,
        }
        return u
    },
]
let monsters = {
    shadow,
    quaesitor,


    him,
}
let currentmonsters = {
}

let roomhistory = {}

let images = {}
function img(src) {
    if (images[src]) {
        return images[src]
    }
    else {
        let dom = document.createElement("img")
        dom.src = "Image/"+src
        if (!dom) {
            console.error("Image with provided source "+src+" DOES NOT EXIST!!!! GET IT RIGHT!!!!!!!!!!!!");
            return
        }
        else {
            images[src] = dom
            return dom
        }
    }
}

let sounds = {}
function sound(src, onetime) {
    if (sounds[src] || !onetime) {
        return sounds[src]
    }
    else {
        let dom = new Audio("Sound/"+src)
        dom.src = "Sound/"+src
        if (!dom) {
            console.error("Sound with provided source "+src+" DOES NOT EXIST!!!! GET IT RIGHT!!!!!!!!!!!!");
            return
        }
        else {
            if (!onetime) {
                sounds[src] = dom 
            }
            return dom
        }
    }
}

let engine = {
    updateMap() {
        let i

        ctx.filter = "none"
        ctx.globalAlpha = 1
        for (i in room.map) {

            ctx.fillStyle = room.map[i].color || "black"
            if (!room.map[i].hidden) {
                ctx.fillRect(room.map[i].x,room.map[i].y,room.map[i].w,room.map[i].h)
            }
        }
        for (i in room.deco) {

            ctx.fillStyle = "black"
            ctx.fillRect(room.deco[i].x,room.deco[i].y,room.deco[i].w,room.deco[i].h)
        }
        for (i in room.extra) {

            ctx.fillStyle = room.extra[i].color 
            ctx.fillRect(room.extra[i].x,room.extra[i].y,room.extra[i].w,room.extra[i].h)
        }
        for (i in currentmonsters) {

            if (currentmonsters[i].roomnum == player.room) {
                ctx.fillStyle = "orange" 
                console.log(i)
            
                let image = img(currentmonsters[i].img)
                ctx.drawImage(image,currentmonsters[i].x - image.width/2,currentmonsters[i].y - image.height/2)
            }

        }

        let uisort = ui.toSorted((a, b) => a().layer - b().layer)
        for (i in uisort) {
            ctx.globalAlpha = uisort[i]().opacity || 1
            if (uisort[i]().show) {
                ctx.filter = uisort[i]().filter || "none"
                if (Object.keys(uisort[i]()).includes("text")) {
                    ctx.fillStyle = uisort[i]().color
                    ctx.font = uisort[i]().size+"px sans-serif"
                    ctx.textAlign = uisort[i]().align || "start"
                    ctx.fillText(String(uisort[i]().text),uisort[i]().x,uisort[i]().y,uisort[i]().maxwidth)
                }
                else if (Object.keys(uisort[i]()).includes("src")) {
                    let image = img(uisort[i]().src)
                    ctx.filter = uisort[i]().filter || "none"
                    if (ctx.filter == uisort[i]().filter) {
                        ctx.drawImage(image,uisort[i]().x - image.width/2,uisort[i]().y - image.height/2,uisort[i]().w,uisort[i]().h)
                    }
                }
                else {
                    ctx.fillStyle = uisort[i]().color
                    ctx.filter = uisort[i]().filter || "none"
                    ctx.fillRect(uisort[i]().x,uisort[i]().y,uisort[i]().w,uisort[i]().h)
                }
            }
                

        }
    },
    draw(x, y, height, width, col = true) {
        if (col) {
            room.map.push({
                x: x,
                y: y,
                w: width,
                h: height,

            })
        }
        else {
            room.deco.push({
                x: x,
                y: y,
                w: width,
                h: height,
            })
        }
    },
    drawui(options = 
        {
            x: 0,
            y:0,
            show: player.died,
            h: ctx.canvas.height,
            w: ctx.canvas.width,
            filter: "none",
            color: "rgb(0, 0, 0)",layer: 1400000
        }) {
        ui.push(options)
    },
    eraseMap() {
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
    },
}


function init() {
    canvas = document.createElement("canvas")
    canvas.height = 900
    canvas.width = 1450
    document.body.style.margin = "0"
    canvas.style.margin = "9px"
    canvas.style.backgroundColor = "grey"
    canvas.style.imageRendering = "pixelated"


    ctx = canvas.getContext("2d")

    onkeydown = (ev) => {
        if (!player.currentkeys.includes(ev.key)) {
            player.currentkeys.push(ev.key)
        }
    }
    onkeyup = (ev) => {
        if (player.currentkeys.includes(ev.key)) {
            player.currentkeys.splice(player.currentkeys.indexOf(ev.key), 1)
        }
    }

    function _frameconstant() {
        engine.eraseMap()
        ctx.beginPath()
        ctx.filter = "none"
        ctx.fillStyle = "black"
        ctx.fillRect(player.x - player.size/2,player.y - player.size/2,player.size, player.size)
        //ctx.arc(player.x,player.y,player.size,0,Math.PI*2)
        ctx.stroke()
        move()
        engine.updateMap()

        requestAnimationFrame(_frameconstant)
    }

    _frameconstant()

    setRoom("start")
    player.room = 0

    


    document.body.appendChild(canvas)
}
function checkPlayerCollision() {
    let collided = 0
    player.collided = 0

    let i

    for (i in room.map) {
        if ((player.x + player.size > room.map[i].x && player.x - player.size < room.map[i].x + room.map[i].w) && (player.y + player.size > room.map[i].y && player.y - player.size < room.map[i].y + room.map[i].h)) {
            player.collided = true
        }
        else if (!player.collided){
            player.collided = false
        }
    }

    if (player.x - player.size < 0 || player.x + player.size > canvas.width || player.y - player.size < 0 || player.y + player.size > canvas.height) {
        player.collided = true
    }


}

function move() {
    if (player.currentkeys.includes("q") && player.sprint.sprint > 0) {
        player.speed = 15
        player.sprint.sprint -= player.sprint.lost
    }
    else {
        player.speed = 10
        player.speed = Math.max(Math.max(player.speed, 0), 10)
        if (player.sprint.sprint+1 > player.sprint.maxsprint) {
            player.sprint.sprint = player.sprint.maxsprint
        }
        else {
            player.sprint.sprint += 1
        }
    }
    if (player.currentkeys.includes("w")) {
        player.y -= player.speed
        checkPlayerCollision()
        if (player.collided) {
            player.y += player.speed
        }
    }
    if (player.currentkeys.includes("a")) {
        player.x -= player.speed
        checkPlayerCollision()
        if (player.collided) {
            player.x += player.speed
        }
    }
    if (player.currentkeys.includes("s")) {
        player.y += player.speed
        checkPlayerCollision()
        if (player.collided) {
            player.y -= player.speed
        }
    }
    if (player.currentkeys.includes("d")) {
        player.x += player.speed
        checkPlayerCollision()
        if (player.collided) {
            player.x -= player.speed
        }
    }

}

function getEventObjectFromPoint(point) {
    for (i in room.extra) {
        if (point.x >= room.extra[i].x && point.x <= room.extra[i].x + room.extra[i].w && point.y >= room.extra[i].y && point.y <= room.extra[i].y + room.extra[i].h && (room.extra[i].type == "event" || room.extra[i].type == "start" || room.extra[i].type == "end")) {
            return i
        }
    }

    return null
}

function getObjectFromPoint(point) {
    for (i in room.map) {
        if (point.x >= room.map[i].x && point.x <= room.map[i].x + room.map[i].w && point.y >= room.map[i].y && point.y <= room.map[i].y + room.map[i].h) {
            return i
        }
    }

    return null
}

function distanceFrom(a, b) {
    return Math.abs(Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2))
}

function sendsignal(signal, param = {properties: []}) {
        /*{
            properties: [
                //Properties to change
                ["x", 100],
                ["y", 200],
                ["color", "blue"]
            ],
        }*/
        function f(x) {
            console.log(x)
            for (i in room.map) {
                if (Object.keys(room.map[i]).includes("receiver")) {
                    console.log(x,room.map[i].receiver,x == room.map[i].receiver)
                    if (room.map[i].receiver == x) {
                        console.log("reciver is mtch")
                        if (Object.keys(param).includes("properties")) {
                            for (j in param.properties) {
                                console.log("checking")
                                if (param.properties[j][0] == "hidden") {
                                    if (param.properties[j][1].toLowerCase() == "true") {
                                        room.map[i][param.properties[j][0]] = true
                                    }
                                    else {
                                        room.map[i][param.properties[j][0]] = false
                                    }
                                }
                                else {
                                    room.map[i][param.properties[j][0]] = param.properties[j][1]
                                }
                            }
                        }
                    }
                }
            }
        }
        if (typeof signal == "object") {
            for (i in signal) {
                f(signal[i])
            }
        }
        else {
            f(signal)
        }
}

async function dialog(text, speed) {
    game.dialog.on = true
    game.dialog.text = ""

    for (i in text) {
        const index = i
        await new Promise((resolve) => {
            setTimeout(() => {
                game.dialog.text += text.at(Number(index))
                resolve()
            },speed)
        })
    }
    

}

//load room from mapeditor save
function loadroomfromsave(x,i) {
    if(!i)i=0
    let savedmaps = JSON.parse(atob(localStorage.TJSRR_Dressyapper_MapEditor_Save)).maps
    if (Object.keys(savedmaps).includes(x)) {
        if (Object.keys(TJSRR.rooms).includes(x+(i>0?"("+i+")":""))) {
            if (confirm("This room is already taken, would you like to save it as: "+x+" ("+(i+1)+")?")) {
                loadroom(x,i+1)
                return
            }
            else {
                return 
            }
        }
        TJSRR.rooms[x+(i>0?"("+i+")":"")] = []
        for (i in savedmaps[x+(i>0?"("+i+")":"")]) {
            TJSRR.rooms[x+(i>0?"("+i+")":"")].push(savedmaps[x][i])

        }
    }
    else {
        console.log("Saved maps:", savedmaps)
        alert("You do not have this room in the map editor! Please try again or open console (ctrl/cmd + shift + C) to check your map editor data.")
    }
}

function getNextRoomSpawn() {
    let rng = Math.random()
    for (i in Object.keys(TJSRR.rooms).reverse()) {
        if (!TJSRR.chance[Object.keys(TJSRR.rooms).reverse()[i]] && !TJSRR.setrooms.includes(Object.keys(TJSRR.rooms).reverse()[i])) {
            TJSRR.chance[Object.keys(TJSRR.rooms).reverse()[i]] = 0.5
        }
    }

    let rooms = []

    for (j in TJSRR.chance) {
        let chance = TJSRR.chance[j]
        if (rng > chance) {
            rooms.push(j)
            break
        }
    }
    
    
    for (k in TJSRR.chance) {
        let chance = TJSRR.chance[k]
        if (chance == TJSRR.chance[rooms[0]] && k != rooms[0]) {
            rooms.push(k)
        }
    }

    if (rooms.length == 0) {
        return "basic_room"
    }
    else {
        return rooms[Math.floor(Math.random()*rooms.length)]
    }

    
}

function setRoom(roomname, prev) {
    room.map = []
    room.deco = []
    room.waypoint = []
    room.extra = []
    if (typeof roomname == "string") {
        let roomobj = TJSRR.rooms[roomname]

        if (!roomobj) {
            alert(roomname+" does not exist")
        }

        for (i in roomobj) {
            if (roomobj[i].type == "obj") {
                room.map.push(roomobj[i])
            }
            else if (roomobj[i].type == "waypoint") {
                room.waypoint.push(roomobj[i])
            }
            else {
                room.extra.push(roomobj[i])
            }  
        }

        room.start = null
        room.end = null

        for (i in room.extra) {
            if (room.extra[i].type == "start") {
                room.start = [room.extra[i], i]
            }
            if (room.extra[i].type == "end") {
                room.end = [room.extra[i], i]
            }
            if (room.extra[i].type == "waypoint") {
                room.waypoint.push(roomobj[i])
            }
        }



        if (!prev) {
            if (room.start == null) {
                player.x = canvas.width/2
                player.y = canvas.height/2
            }
            else if (room.start[0].h > room.start[0].w) {
                player.x = (room.start[0].x + room.start[0].w/2) + 100
                player.y = (room.start[0].y + room.start[0].h/2)
            }
            else if (room.start[0].w > room.start[0].h) {
                player.x = (room.start[0].x + room.start[0].w/2)
                player.y = (room.start[0].y + room.start[0].h/2) - 100
            }
        }
        else {
            if (room.end == null) {
                player.x = canvas.width/2
                player.y = canvas.height/2
            }
            else if (room.end[0].h > room.end[0].w) {
                player.x = (room.end[0].x + room.end[0].w/2) - 100
                player.y = (room.end[0].y + room.end[0].h/2)
            }
            else if (room.end[0].w > room.end[0].h) {
                player.x = (room.end[0].x + room.end[0].w/2)
                player.y = (room.end[0].y + room.end[0].h/2) + 100
            }
        }
    }
    else if (typeof roomname == "object") {
        let roomobj = roomname
        for (i in roomobj) {
            if (roomobj[i].type == "obj") {
                room.map.push(roomobj[i])
            }
            else if (roomobj[i].type == "waypoint") {
                room.waypoint.push(roomobj[i])
            }
            else {
                room.extra.push(roomobj[i])
            } 
            

            
        }

        room.start = null
        room.end = null

        for (i in room.extra) {
            if (room.extra[i].type == "start") {
                room.start = [room.extra[i], i]
            }
            if (room.extra[i].type == "end") {
                room.end = [room.extra[i], i]
            }
            
        }

        if (!prev) {
            if (room.start == null) {
                player.x = canvas.width/2
                player.y = canvas.height/2
            }
            else if (room.start[0].h > room.start[0].w) {
                player.x = (room.start[0].x + room.start[0].w/2) + 100
                player.y = (room.start[0].y + room.start[0].h/2)
            }
            else if (room.start[0].w > room.start[0].h) {
                player.x = (room.start[0].x + room.start[0].w/2)
                player.y = (room.start[0].y + room.start[0].h/2) - 100
            }
        }
        else {
            if (room.end == null) {
                player.x = canvas.width/2
                player.y = canvas.height/2
            }
            else if (room.end[0].h > room.end[0].w) {
                player.x = (room.end[0].x + room.end[0].w/2) - 100
                player.y = (room.end[0].y + room.end[0].h/2)
            }
            else if (room.end[0].w > room.end[0].h) {
                player.x = (room.end[0].x + room.end[0].w/2)
                player.y = (room.end[0].y + room.end[0].h/2) + 100
            }
        }
    }

}

function nextRoom() {
    //maxroom is messing up sometimes, the latest room is changing when you eneter it fix this now
    //why am i keeping this
    //i believe i fixed it
    roomhistory[player.room] = room.map.concat(room.deco).concat(room.extra).concat(room.waypoint)

    player.room++

    if (player.room > player.maxroom) {
        player.maxroom = player.room
    }

    if (!roomhistory[player.room]) {
        //new room
        setRoom(getNextRoomSpawn())
        roomhistory[player.room] = room.map.concat(room.deco).concat(room.extra).concat(room.waypoint)
        if (player.room > settings.roomhistorylength) {
            delete roomhistory[player.room-settings.roomhistorylength] 
        }
        monsterspawn()
    }
    else {
        setRoom(roomhistory[player.room])
    }
}

function previousRoom() {
    setRoom(roomhistory[player.room-1], true)
    player.room--;
}

function mapeditormap(name) {
    return JSON.parse(atob(localStorage.TJSRR_Dressyapper_MapEditor_Save)).maps[name]
}

function lerp(a, b, dt) {
    return a + (b - a) * dt
}

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

function getWayPointsOfRoom(obj) {
    let waypoint = []
    for (i in obj) {
        //console.log(obj[i], obj[i].type)
        if (obj[i].type == "waypoint") {
            waypoint.push(obj[i])
        }
    }

    waypoint.sort((a, b) => a.order - b.order)

    return waypoint
}    

function monsterspawn() {
    let chance = {s:1}
    if (player.room > 10) {
        if (Math.random() < 1/(10*chance.s) && (game.current.shadow < 1 || !game.current.shadow)) {
            new shadow()
            chance.s = 1
        }
        else {
            chance.s -= 0.1
        }
    }
    // <1/10 1/9

}

//returns the first instance of this type, good for start or end objects
function getElementFromRoom(obj, type) {
    for (i in obj) {
        if (obj[i].type == type) {
            return obj[i]
        }
    }
    return null
}

function getDeathDialog(details = {diedTo: "shadow", deathtime: 1}) {
    //deathtime is this amount of times you died to shadow, 
    //dying for the first time would make it 1
    if (!details.diedTo) {
        return TJSRR.dialog.otherdeath.unknown
    }
    else {
        if (details.diedTo == "shadow") {
            if (details.deathtime == 1) {
                return TJSRR.dialog.monsterdeath.shadow.first
            }
            else if (details.deathtime == 2) {
                return TJSRR.dialog.monsterdeath.shadow.second
            }
            else if (details.deathtime == 3) {
                return TJSRR.dialog.monsterdeath.shadow.third
                
            }
            else if (details.deathtime == 4) {
                return TJSRR.dialog.monsterdeath.shadow.fourth
            }
            else {
                return TJSRR.dialog.monsterdeath.shadow["general"+(Math.floor(Math.random() * 2) + 1)]
            }
        }
        if (details.diedTo == "quaesitor") {
            if (details.deathtime == 1) {
                return TJSRR.dialog.monsterdeath.quaesitor.first
            }
            else {
                return TJSRR.dialog.monsterdeath.shadow["general"+(Math.floor(Math.random() * 2) + 1)]
            }
        }
        if (details.diedTo == "him") {
            return TJSRR.dialog.monsterdeath.him.general
        }
    }
}

async function killplayer(monster) {
    if (player.died == false) {
        player.died = true
        if (!savefile.deaths[monster]) {
            savefile.deaths[monster] = 0
        }
        savefile.deaths[monster] += 1

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            },1000)
        }).then(async () => {
            let j = 0
            let dialog = getDeathDialog({diedTo: monster, deathtime:savefile.deaths[monster]})
            while (j < dialog.length) {
                let i = 0
                await new Promise((resolve) => {
                    game.deathtext = ""
                    let loop = setInterval(() => {
                        if (i >= dialog[j].length) {
                            clearInterval(loop)
                            j++;
                            resolve()
                        }
                        else {
                            game.deathtext += dialog[j][i]
                            i++;
                        }
                    },100)
                }).then(() => {
                    return new Promise((resolve) => {setTimeout(() => {
                        resolve()
                    },1000 + dialog[j-1].length*10)})
                })
            }
        }).then(() => {
            resetGame()
        })
    }





}

function resetGame() {
    player.room = 0
    player.maxroom = 0
    roomhistory = {}
    game.totalmonsters = 0
    setRoom("start")
    player.died = false
}


setInterval(() => {
    if (getEventObjectFromPoint(player) == room.end[1]) {
        nextRoom()
    }
    else if (room.start && getEventObjectFromPoint(player) == room.start[1]) {
        previousRoom()
    }
})




init()