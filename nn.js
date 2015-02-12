var NN = function(options){
  this.layers = options['layers'] //np [5,2,1]
  this.rate = options['rate'] || 0.7
  this.momentum = options['momentum'] || 0
  this.bias = options['bias'] || 0
  this.weights = []
  this.weights0 =[]
  this.weightsC =[]
  this.outputs = []
  this.errors  = []
  this.errors_in = []
  this.b = options['b'] || 0.9
  this.mse0 = 0
  this.mse = 0
  for (var i = 0; i < this.layers.length-1; i++){
    this.weights[i] = []
    this.weights0[i] = []
    this.weightsC[i] = []
    for (var j = 0; j <= this.layers[i]; j++){
      this.weights[i][j] = []
      this.weights0[i][j] = []
      this.weightsC[i][j] = []
      for (var k = 0; k <= this.layers[i+1]; k++){
        this.weights[i][j][k] = Math.random()*4 - 2
        this.weights0[i][j][k] = 0
        this.weightsC[i][j][k] = 0
      }
    }
  }
  for (var i = 0; i < this.layers.length; i++){
    this.outputs[i] = []
    this.errors[i]  = []
    this.errors_in[i] = []
  } 


}

NN.prototype = {
  learn: function(data, target) {
    this.outputs[0] = data
    if (this.layers.length > 1){
      for (var l = 1; l <= this.layers.length; l++){ //ilosc wartstw-1 
        for (var i = 0; i < this.layers[l]; i++){ //neurony warstwy l
          var sum = 0
          for (var j = 0; j <= this.layers[l-1]; j++){ //neurony wartswy l-1
            if (j < this.layers[l-1])
              sum += this.outputs[l-1][j]*this.weights[l-1][j][i]
            else if (this.bias != 0)
              sum += this.bias * this.weights[l-1][j][i]
            //console.log('w:'+this.weights[l-1][j][i]+' out:'+this.outputs[l-1][j])
          }

          this.outputs[l][i] = this.sigm(sum)
        }
      }

      //bledy wyjsciowe
      var last_layer = this.layers.length-1
      this.mse = 0
      for (var i = 0; i < this.layers[last_layer]; i++){
        this.errors[last_layer][i] = target[i] - this.outputs[last_layer][i]
        this.mse += Math.abs(this.errors[last_layer][i])
        this.errors_in[last_layer][i] = this.outputs[last_layer][i] * this.errors[last_layer][i] * (1 - this.outputs[last_layer][i])
      }
      this.mse /= this.layers[last_layer]
      
     //bledy w ukrytych
      for (var i = this.layers.length-2; i >= 1; i--){
        for (var j = 0; j < this.layers[i]; j++){
          this.errors[i][j] = 0
          for (var k = 0; k < this.layers[i+1]; k++){
            this.errors[i][j] += this.errors_in[i+1][k] * this.weights[i][j][k]
            //console.log(i+'.'+j+'.'+k+'.'+this.errors_in[i+1][k] + ' '+this.weights[i][j][k])
          }

          this.errors_in[i][j] = this.errors[i][j]*this.outputs[i][j]*(1-this.outputs[i][j])
        }
      }
     
      //aktualizacja wag
      this.copyWeights(this.weightsC, this.weights)
      for (var l = 0; l < this.layers.length - 1; l++){
        for (var i = 0; i < this.weights[l].length; i++){
          for (var j = 0; j < this.layers[l+1]; j++){
            
            if (i == this.weights[l].length - 1)
              this.outputs[l][i] = this.bias
            //console.log(l+'.'+i+'.'+j+'. err:'+this.errors_in[l+1][j]+' out:'+this.outputs[l][i]+' w:'+this.weights[l][i][j]+' w0:'+this.weights0[l][i][j])
            this.weights[l][i][j] += this.rate*this.errors_in[l+1][j]*this.outputs[l][i] - this.momentum * ( this.weights[l][i][j] - this.weights0[l][i][j])
          }
        }
      }
      this.copyWeights(this.weights0, this.weightsC)
    }
  },
  sigm: function(n){
    return 1/(1+Math.exp(-this.b*n) )
  },
  output: function(){
    return this.outputs[this.layers.length-1]
  },
  copyWeights: function(arr1, arr2){
    for (var i = 0; i < this.layers.length; i++){
      for (var j = 0; j <= this.layers[i]; j++){
        for (var k = 0; k < this.layers[i+1]; k++){
          arr1[i][j][k] = arr2[i][j][k]
        }
      }
    }
  },
  process: function(data){
    this.outputs[0] = data
    for (var l = 1; l <= this.layers.length; l++){ //ilosc wartstw-1 
      for (var i = 0; i < this.layers[l]; i++){ //neurony warstwy l
        var sum = 0
        for (var j = 0; j <= this.layers[l-1]; j++){ //neurony wartswy l-1
          if (j < this.layers[l-1])
            sum += this.outputs[l-1][j]*this.weights[l-1][j][i]
          else if (this.bias != 0)
            sum += this.bias * this.weights[l-1][j][i]
        }
        this.outputs[l][i] = this.sigm(sum)
      }
    }
    return this.outputs[this.layers.length-1]
  }

}

