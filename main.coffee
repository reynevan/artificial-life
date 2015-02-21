###
TODO
uczenie sie od kolegow
wspolne jedzenie duzych roslin
###
jQuery ($) ->
  config = 
    interval: 70
    pause: false

  settings =
    energyFromFood: 0.5
    initPlants: ($(window).height() * $(window).width()) / 8000
    initOrganisms: 15

  canvas = document.getElementById 'can'
  canvas2 = document.getElementById 'can2'
  can = {
    w: $(window).width(),
    h: screen.height*0.8
  }
  can2 = {
    w: can.w,
    h: 600
  }

  canvas.width = can.w
  canvas.height = can.h

  canvas2.width = can.w
  canvas2.height = can2.h

  console.log can.h+' '+$(window).height()

  ctx = canvas.getContext('2d')
  ctx2 = canvas2.getContext('2d')
  
  window.plants = 0

  class Organism
    @id = 0
    constructor: (genom, options) ->
      #genom = [max_r, speed, likes group, momentum, rate]
      this.id = Organism.id++
      this.setGenom()      
      this.setOptions(options)
      this.initialize() 
      this.logic()
      
    initialize: ->
      this.deg = Math.random()*2*Math.PI
      this.max_r = this.genom[0]
      this.r = (this.max_r/5).nzero(1)
      this.speed = this.genom[1]
      this.friendly = this.genom[2]
      this.layers = [3,2]
      this.brain = new NN {'layers':this.layers, 'momentum': this.genom[3], 'rate': this.genom[4]}
      this.fails = 0
      this.successes = 0
      this.energy = 15
      this.init_t = 100 
      this.t = this.init_t
      this.age = 0
      this.maxAge = 150
      this.dead = false
      this.ignored = [] #ignored enemies
      this.memory = 20 #max number of igonred enemies
      this.partner = -1 #id
      this.searchingPartner = false
      this.needFood = true
      this.reproduced = false
      this.reproducedTime = 0

    setOptions: (options) ->
      if options
        if options['coords']
            this.x = options['coords'].x 
            this.y = options['coords'].y
        if options['color']
          this.color = 
            red: options['color'].red
            green: options['color'].green
            blue: options['color'].blue
      else
        if Math.random() < 0.33
          this.color = 
            red: 255
            green: 0
            blue: 0
        else if Math.random() < 0.66
          this.color = 
            red: 0
            green: 255
            blue: 0
        else
          this.color = 
            red: 0
            green: 0
            blue: 255
        this.x = Math.random()*(can.w+10)-20
        this.y = Math.random()*(can.h+10)-20

    setGenom: (genom) ->
      #genom = [max_r, speed, likes group, momentum, rate]
      if !genom
        this.genom = []
        this.genom[0] = Math.random()*4+2
        this.genom[1] = Math.random()*20+20
        this.genom[2] = Math.round(Math.random())
        this.genom[3] = Math.random()*0.8
        this.genom[4] = Math.random()*5
        if Math.random() > 0.9
          this.genom[2] = (++this.genom[3])%2 
      else
        this.genom = genom

    logic: ->
      if this.deg > Math.PI*2 
        this.deg = this.deg - Math.PI*2
      else if this.deg < -2*Math.PI
        this.deg = this.deg + Math.PI*2
      
      this.t -= config.interval
      if this.t < 0
        this.energy -= (this.r/(5*config.interval) + this.speed/(config.interval*50))/5
        this.t = this.init_t
        this.age += (config.interval/1000)*this.init_t/config.interval
        this.age = this.age.round(10)
        
        this.r += (this.age*0.0001)*this.max_r
        if this.r > this.max_r
          this.r = this.max_r
        
        if this.energy < 0 || this.age > this.maxAge
          this.die()
        else if this.energy > 20
          this.needFood = false
        else if this.energy < 12
          this.needFood = true
      
      if this.needFood #|| this.reproduced || (!this.reproduced && this.age < 30)
        this.searchFood()
        if (this.friendly)
          this.stayInGroup()
        this.energy -= (this.r/(5*config.interval) + this.speed/(config.interval*50))/2
      else 
        if !this.reproduced
          this.searchPartner()

      if this.reproducedTime > 0
        this.reproduced = true
        this.reproducedTime -= config.interval
      else
        this.reproduced = false
        
    die: ->
      this.dead = true 
      console.log 'Bleghelebe!!!!!!!!!!'

    draw: ->
      ctx.lineWidth = 1
      ###this.eyes = 
        left: {
          x: this.x+Math.sin(this.deg+Math.PI/2-Math.PI/5)*this.r
          y: this.y+Math.cos(this.deg+Math.PI/2-Math.PI/5)*this.r
        }
        right: {
          x: this.x-Math.sin(this.deg+Math.PI/2+Math.PI/5)*this.r
          y: this.y-Math.cos(this.deg+Math.PI/2+Math.PI/5)*this.r
        }###
      ctx.save()
      
      if this.searchingPartner
        ctx.shadowColor = 'rgb('+(255-this.color.red)+','+(255-this.color.green)+','+(255-this.color.blue)+')'
        ctx.shadowBlur = 6
        #ctx.beginPath()
        #ctx.arc this.x, this.y, this.r+1, 0, Math.PI*2
        #ctx.fill()
      
      ###ctx.beginPath()
      ctx.arc this.eyes.left.x, this.eyes.left.y, this.r/4, 0, Math.PI*2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc this.eyes.right.x, this.eyes.right.y, this.r/4, 0, Math.PI*2
      ctx.stroke()###

      ctx.fillStyle = 'rgb('+this.color.red+','+this.color.green+','+this.color.blue+')'
      ctx.beginPath()
      #ctx.arc this.x, this.y, this.r, 0, Math.PI*2
      ctx.moveTo this.x+Math.sin(this.deg)*this.r, this.y+Math.cos(this.deg)*this.r
      ctx.lineTo this.x+Math.sin(this.deg+2.5*Math.PI/3)*this.r, this.y+Math.cos(this.deg+2.5*Math.PI/3)*this.r
      ctx.lineTo this.x+Math.sin(this.deg-2.5*Math.PI/3)*this.r, this.y+Math.cos(this.deg-2.5*Math.PI/3)*this.r
      ctx.fill()

      ctx.restore()
      #ctx.fillText this.energy.round(10), this.x, this.y-this.r-3
      if (this.friendly)
        ctx.fillText '+', this.x, this.y+2*this.r+5 

    searchFood: ->
      this.searchingPartner = false
      if Math.random() > 0.9
        this.deg += Math.PI*(Math.random()*0.4-0.2)
      inSight = []
      for i in [0...window.objects.length]
        obj = window.objects[i]
        d = dist(this, obj)
        obj.d = d
        obj.index = i
        if d < 100
          if (obj.genom[0] == -1 && obj.r < this.r ) || obj.genom[0] == 1
            inSight.push(obj)
      inSight.sort (a,b)-> a.d-b.d
      
      if inSight.length > 0
        obj = inSight[0]
        degToObj = -Math.atan2(this.x-obj.x, obj.y-this.y)
        decision = this.brain.process(obj.genom.slice(1))
        if decision[1] < 0.8 && decision[0] > 0.5
          #console.log 'chyba ok'
          this.deg = degToObj
        else
          if Math.abs(this.deg - degToObj) < Math.Pi*0.2
            #console.log 'wruk!!!!!'
            this.deg += 0.3
            
        if obj.d < obj.r + 3
          # [1 0] zarcie
          # [0 1] wypierdalac!!!!!
          learn = if obj.genom[0] == -1 then [1, 0] else [0, 1]
          this.brain.learn(obj.genom.slice(1), learn)
          window.objects.splice(obj.index,1)
          if obj.genom[0] == -1
            #console.log 'czuje dobrze wygryw'
            this.successes++
            this.energy += obj.r*settings.energyFromFood
            if this.r < this.max_r
              this.r += obj.r/2 
            #window.objects.push(new Food())
          else
            #console.log 'tyle pszegrac ._.'
            this.fails++
            this.energy-=2
            window.objects.push(new Predator())
      this.move()
      
    move: ->
      if this.x > can.w - 10
        this.x = 20
      if this.x < 10
        this.x = can.w - 20
      if this.y < 10
        this.y = can.h - 20
      if this.y > can.h - 10
        this.y = 20
      this.x += this.speed * Math.sin(this.deg) / 10
      this.y += this.speed * Math.cos(this.deg) / 10

    stayInGroup: ->
      this.avoidPredators()
      inSight = []
      for organism in window.organisms
        d = dist(this, organism)
        if d < 150 && organism.id != this.id
          inSight.push(organism)
      deg = 0
      for org in inSight
        deg += (-Math.atan2(this.x-org.x, org.y-this.y))/inSight.length
      
      if this.deg < deg
        this.deg += 0.1
      else 
        this.deg -= 0.1

    avoidPredators: ->
      if Math.random() > 0.9
        this.deg += Math.PI*(Math.random()*0.4-0.2)
      inSight = []
      for i in [0...window.objects.length]
        obj = window.objects[i]
        d = dist(this, obj)
        obj.d = d
        obj.index = i
        if d < 100
          inSight.push(obj)
      inSight.sort (a,b)-> a.d-b.d

      if inSight.length > 0
        obj = inSight[0]
        while this.ignored.indexOf(obj.id) >= 0
          if (inSight.length > 1)
            inSight.splice(0,1)
            obj = inSight[0]
          else
            return
          
        degToObj = -Math.atan2(this.x-obj.x, obj.y-this.y)
        decision = this.brain.process(obj.genom.slice(1))
        if decision[1] > 0.8 
          if this.ignored.indexOf(obj.id) < 0
            this.ignored.push(obj.id)
          if (this.ignored.length > this.memory)
            this.ignored.shift()
          if Math.abs(this.deg - degToObj) < Math.Pi*0.2
            #console.log 'wruk!!!!!'
            this.deg += 0.3            

    searchPartner: ->
      this.searchingPartner = true
      this.avoidPredators()
      move = true
      inSight = []
      for organism in window.organisms
        d = dist(this, organism)
        if d < 300 && organism.id != this.id && organism.searchingPartner && !organism.reproduced
          inSight.push(organism)
      inSight.sort (a,b)-> a.energy-b.energy

      if inSight.length > 0
        organism = inSight[0]
        d = dist(this, organism)
        this.partner = organism.id
        if organism.partner == this.id
          this.deg = -Math.atan2(this.x-organism.x, organism.y-this.y)
          if d < this.r+organism.r+2
            this.reproduce(organism)
      if move
        this.move()
    
    reproduce: (organism)->
      childrenNumber = rnd(1, 2).nzero().round(1) 
      for child in [0...childrenNumber]
        sliceN = Math.round(Math.random()*this.genom.length)
        newGenom = []
        for i in [0...this.genom.length]
          if i < sliceN
            newGenom[i] = this.genom[i]
          else
            newGenom[i] = organism.genom[i]

        #mutations
        for i in [0...newGenom.length]
          if Math.random() > 0.9
            gen = newGenom[i]
            newGenom[i] += ((Math.random()*gen-(gen/2))).nzero()+0.5
            if Math.random() > 0.9
              newGenom[i] = (Math.random()*10*gen-(5*gen)).nzero()+0.5
        
        ###is friendly when both parents are friendly
        #  when one parent is friendly and second one isn't, child has 50% to be friendly
        ###
        if (this.genom[2] && organism.genom[2])
          newGenom[2] = 1
        else if ( (this.genom[2] && !organism.genom[2]) || (!this.genom[2] && organism.genom[2]) )
          newGenom[2] = Math.round(Math.random())
        else
          newGenom[2] = 0

        childColor = mixColors(this.color, organism.color)
        window.organisms.push(new Organism(newGenom, {'coords': {x: this.x+10, y: this.y+10}, 'color': childColor}))
        
      this.reproducedTime = 40000
      organism.reproducedTime = 40000
      this.searchingPartner = false
      organism.searchingPartner = false

  # genom[0] -1:food  1: predator
  # genom[1] red
  # genom[2] green
  # genom[3] radius
  class Food
    @id = 0
    @spree: ->
      if Math.random() > 0.95
        window.objects.push(new Food())
    constructor: (genom, options)->
      this.id = Food.id++
      this.class = 'plant'
      window.plants++
      if options && options['coords']
        this.x = options['coords'].x
        this.y = options['coords'].y
      else
        this.x = Math.random()*(can.w-100)+50
        this.y = Math.random()*(can.h-100)+50
      if options && options['color']
        this.color = 
          red: options['color'].red
          green: options['color'].green
          blue: options['color'].blue
      else
        this.color =
          red: rnd(0, 100).nzero().round(1)
          green: rnd(255, 100).nzero().round(1)
          blue: rnd(0, 10).nzero().round(1)
      if options && options['r']
        this.max_r = options['r']
      else
        this.max_r = rnd(0.5, 1.5).round(100).nzero()+0.5
      if options && options['age']
        this.age = options['age']
      else 
        this.age = 0
      this.genom = [-1, (this.color.red/70).round(100), (this.color.green/70).round(100), this.max_r*1.5]
      this.ignore = false
      this.init_t = 1000
      this.t = this.init_t
      this.reproduced = false
      this.reproducedTime = 0
      this.dead = false
      this.r = (this.age/20)*this.max_r
    logic: ->
      this.neighbours = 0
      this.t -= config.interval
      if this.t < 0

        this.t = this.init_t
        this.age += (config.interval/1000)*this.init_t/config.interval
        this.age = this.age.round(10)
        
        for i in [0...window.objects.length]
          obj = window.objects[i]
          if obj.class == 'plant'
            d = dist(this, obj)
            if d < 30
              this.neighbours++

        if this.age > Math.random()*10+5 && !this.reproduced && this.neighbours < 4
          children = (Math.random()*5).round(1)
          for i in [0...children]
            this.reproduce()
        this.r = (this.age/20)*this.max_r
        if this.r > this.max_r
          this.r = this.max_r

        if this.reproducedTime > 0
          this.reproducedTime -= this.init_t
          this.reproduced = true
        else
          this.reproducedTime = 0
          this.reproduced = false

        if this.age > 80
          this.dead = true
          window.plants--
          console.log 'pssssstrzczc'

         

    reproduce: ->
      newColors = [this.color.red, this.color.green, this.color.blue]
      for i in [0...3]
        if Math.random() > 0.9
          newColors[i] += rnd(0, 20).round(1)
          newColors[i].nzero()
      newColor = 
        red: newColors[0]
        green: newColors[1]
        blue: newColors[2]
      coords = 
        x: (if Math.random() > 0.5 then this.x+Math.random()*15+this.r else this.x-Math.random()*15-this.r).round(1)
        y: (if Math.random() > 0.5 then this.y+Math.random()*15+this.r else this.y-Math.random()*15-this.r).round(1)
      if coords.x > 10 && coords.x < can.w - 10 && coords.y > 10 && coords.y < can.h - 10
        newR = (this.r + rnd(0, 1)).nzero(0.5)
        window.objects.push(new Food(null, {'coords': coords, 'color': newColor, 'r': newR}))
        #console.log 'nowa roslinka!!!!!!!!!111'
        this.reproducedTime = Math.random()*20000+10000
      
    draw: ->
      ctx.save()
      ctx.shadowColor = '#0f0';
      ctx.shadowBlur = 2;
      ctx.beginPath()
      ctx.fillStyle = 'rgb('+this.color.red+','+this.color.green+','+this.color.blue+')'
      ctx.arc this.x, this.y, this.r, 0, Math.PI*2
      ctx.fill()

      ctx.restore()

  class Predator
    @id = 0
    constructor: ->
      this.class = 'predator'
      this.id = Predator.id++
      this.x = Math.random()*(can.w-100)+50
      this.y = Math.random()*(can.h-100)+50
      this.seed = Math.random()
      this.r = (this.seed+4).round(100)
      this.red = rnd(255, 100).nzero().round(1)
      this.green = rnd(0, 100).nzero().round(1)
      this.color = 'rgb('+this.red+','+this.green+',0)'
      this.color
      this.genom = [1, (this.red/70).round(100), (this.green/70).round(100), this.r*1.5]
      this.ignore = false
      this.memory = 0
      this.dead = false
    logic: ->

    draw: ->
      if this.memory > 1000
        this.memory = 0
        this.ignore = false
      ctx.save()
      ctx.beginPath()
      ctx.shadowColor = '#f00';
      ctx.shadowBlur = 2;
      ctx.fillStyle = this.color
      ctx.arc this.x, this.y, this.r, 0, Math.PI*2
      ctx.fill()

      ctx.restore()

  init = ->
    window.objects = []
    window.organisms = []
    window.plants = 0
    for i in [0...settings.initOrganisms]
      window.organisms.push new Organism() 
    for i in [0...Math.round(settings.initPlants)]
      window.objects.push(new Food(null, {'age': (Math.random()*5+15).round(1)}))
      if i%4 == 0
        window.objects.push(new Predator())
    window.foods = 0
    time = 1000
    window.i = 0
    window.f0 = 0
    window.f = window.foods
    window.o = window.objects.length
    window. o0 = 0

  removeDead = ->
    for i in [0...window.organisms.length]
      organism = window.organisms[i]
      if organism.dead
        window.organisms.splice(i,1)
        removeDead()
        break
    window.foods = 0
    for i in [0...window.objects.length]
      obj = window.objects[i]
      if obj.class == 'plant'
        window.foods++
        
      if obj.dead
        window.objects.splice(i,1)
        removeDead()
        break

  loopx = ->
    if !config.pause
      if window.organisms.length <= 0
        config.pause = true
        ctx.fillText "THE END", can.w/2, can.h/2
      ctx.clearRect(0, 0,can.w, can.h)
      
      for i in [0...window.organisms.length]
        organism = window.organisms[i]
        organism.logic()
        organism.draw()
      for obj in window.objects
        obj.logic()
        obj.draw()
        
      Food.spree()

      ctx.fillText "Organisms: "+window.organisms.length, 10, 10
      ctx.fillText "Plants: "+window.fw, 10, 30

      time -= config.interval
      if time < 0
        removeDead()
        time = 1000
        
        ctx2.save()
        
        ctx2.clearRect window.i, 0, 10, can2.h

        ctx2.strokeStyle = '#f00'
        ctx2.beginPath()
        ctx2.moveTo window.i, (can2.h-(window.f0*0.5)).nzero(5)
        ctx2.lineTo window.i+1, (can2.h-(window.f*0.5)).nzero(5)
        window.f0 = window.f
        window.f = window.foods
        ctx2.stroke()

        ctx2.beginPath()
        ctx2.strokeStyle = '#0f0'
        ctx2.moveTo window.i, (can2.h-(window.o0*5)).nzero(5), 1, 1
        ctx2.lineTo window.i+1, (can2.h-(window.o*5)).nzero(5), 1, 1
        window.o0 = window.o
        window.o = window.organisms.length
        ctx2.stroke()

        ctx2.restore()
        window.i++
        if window.i > can2.w
          window.i = 0




  init()
  setInterval (-> loopx()),  config.interval 

  ###
  randoms = []
  for i in [-50..200]
    randoms[i] = 0
  for i in [0..10000]
    index = rnd(100,20)
    randoms[index]++
  for i in [-50..200]
    ctx.rect i*3, 500, 2, -randoms[i]
    ctx.fill()
    console.log randoms[i]
  ###
  
  $(document).on 'keydown', (event) ->
    if event.keyCode == 80
      config.pause =! config.pause
    if event.keyCode == 81
      console.log window.objects

  $('#can').on 'click', (event) ->
    click = 
      x: event.pageX
      y: event.pageY
    closest = 9999
    for org in window.organisms
      d = dist(click, org)
      if d < closest
        closest = d
        closest_org = org
    console.log closest_org

  $('#restart').on 'click', (event) ->
    event.preventDefault()
    settings.initPlants = $('#plants').val()
    settings.initOrganisms = $('#organisms').val()  
    init()

dist = (obj1, obj2) ->
  Math.sqrt( Math.pow(obj1.x - obj2.x, 2)+Math.pow(obj1.y - obj2.y, 2) )

uni_rnd = () ->
  Math.random()*2-1

rnd = (mean, dev) ->
  (uni_rnd()+uni_rnd()+uni_rnd())*dev + mean

Number.prototype.nzero = (min) ->
  min = if !min then 0 else min
  if this.valueOf() < 0 then min else this.valueOf()

Number.prototype.round = (n) ->
  Math.round(this.valueOf()*n)/n

mixColors = (color1, color2) ->
  #returns childColor
  newColor = []
  newColor[0] = (color1.red + color2.red)/2
  newColor[1] = (color1.green + color2.green)/2
  newColor[2] = (color1.blue + color2.blue)/2

  #color mutation
  for i in [0..2]
    if Math.random() > 0.9
      newColor[i] += rnd(122,122).round(1)

  childColor =
    red: newColor[0].round(1)
    green: newColor[1].round(1)
    blue: newColor[2].round(1)