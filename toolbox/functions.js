const async = require ('async');
const GoogleSpreadsheet = require('google-spreadsheet');
    const creds = require('./client_secret.json');
    const doc = new GoogleSpreadsheet('1kxcMdb0Gsyg9Oe3NbWMXx1vHopFjqLzneXehoURAN6M');//Character database
    const eventdoc = new GoogleSpreadsheet('1fuXzJ1_rvlHIFRRwTZXfnDrxzyn2yrvukXe0Th_i8-8');//events database
    doc.useServiceAccountAuth(creds, function (err) {
    if (err)
    console.log(err)});
    eventdoc.useServiceAccountAuth(creds, function (err) {
    if (err)
    console.log(err)});


//Remember that all async functions resolving promises must have their function variables declared as local variables BEFORE the Promise object
var roll = Math.floor(Math.random() *10)+1;
var name;
var efn = require('./effects.js');

async function getprop(a, b){
   let search = a;
   let key = b;
   return new Promise(resolve => {
     doc.getRows(13, {'query': 'label = "' + search + '"'}, function(err,row){
         let x = row[0][key];
         resolve (x);
     })
   })
}

module.exports =  {

doom: async function(a){
      let char = a; 
      doc.getRows(2,{
           'query':'label = "' + char + '"'
         },function (err,row){
           let old = row[0].doom;
           let doom = +old + 1;
           row[0].doom = doom;
           row[0].save()
         }
           )},
  
setval: async function(a, b, c, d){
     let index = parseInt(a);
     let searchval = b;
     let keys = c;
     let values = d;
  

   doc.getRows(index, {'query': 'label = "' + searchval + '"'},function(err,row){
      if (err) console.log(err);
        
     for (var i = 0; i < keys.length; i++){
        let key = keys[i];
        let value = values[i]
        row[0][key] = value;
     }
        row[0].save();
        return;
    })
    },
  
  getval: async function(a, b, c){
     let index = parseInt(a);
     let searchval = b;
     let keys = c;
     var x = []
  return new Promise(resolve => {
   doc.getRows(index, {'query': 'label = "' + searchval + '"'},function(err,row){
      if (err) console.log(err);
      
     for (var i = 0; i < keys.length; i++){
        let key = keys[i];
        x[i] = row[0][key];
     }
    resolve (x);
    })
  })
    },
  
  addmadness: async function (a, b, c){
   var dateObj = new Date();
           var month = dateObj.getUTCMonth() + 1; //months from 1-12
           var day = dateObj.getUTCDate();
           var year = dateObj.getUTCFullYear();
  let newdate = month + "/" + day + "/" + year;
  let char = a;
  let value = b;
  let command = c;
    doc.addRow(3,{label: char, date: newdate, value: value, commandgen: command},function(err){
      if (err) console.log(err);
    });
  },
  
  getstate: async function (a, b){
      let total = a;
      let target = b;
      return new Promise(resolve => {
        var x = "0";
        var y = "1";
        if (+target > +total) return resolve (x);
        resolve (y);
      })
  },
  
getproperty: async function (a, b, c){
 let index = a;
 let char = b;
 let searchkey = c;
  
  return new Promise(resolve => {
    doc.getRows(+index, {'query': 'label = "' + char + '"'}, function(err, row){
      if(err) resolve ("error");
      let x = row[0][searchkey];
      resolve (x);
    })
  })
},
  
effectexecute: async function (a, b, c){
   var targets = a;
   var obj = b;
   var trgr = c;
   var index = await this.getproperty(13, targets, 'indexval');
    if (index === '8') targets = await this.getproperty(8, targets, 'occupants');
      console.log('targets = ' + targets);
    if (targets === '') return;
    var effectprop = await this.getproperty(9, obj, "effects")//get string of effect indexes for object
    var effects = effectprop.split(',');
    var targetarray = targets.split(',');
   for (var y = 0; y < targetarray.length; y++) {
     let target = targetarray[y];
     if (target === '') continue;
  for (var i = 0; i < effects.length; i++){//for each effect index pull the properties
    let effect = effects[i];
    var [changefunc, key, value, triggers, timerval] = await this.getval(11, effect, ["changefunc", "keys", "values", "triggers", "timerval"]);
    var n = triggers.indexOf(trgr);//check that trigger is good
    console.log(n);
    if (n === -1) continue;
    efn[changefunc](key, target, value, obj);//create execution function
  }
   }
  
},
  
effectreverse: async function(a, b, c){
    var targets = a;
    var obj = b;
    var trgr = c;
    var index = await this.getproperty(13, targets, 'indexval');
    if (index === '8') targets = await this.getproperty(8, targets, 'occupants');
    console.log('targets = ' + targets);
    if (targets === '') return;
    var effectprop = await this.getproperty(9, obj, "effects")//get string of effect indexes for object
    var effects = effectprop.split(',');
    var targetarray = targets.split(',');
    for (var y = 0; y < targetarray.length; y++) {
    let target = targetarray[y];
      if (target === '') continue;
    for (var i = 0; i < effects.length; i++){//for each effect index pull the properties
    let effect = effects[i];
    var [changefunc, key, value, triggers, timerval] = await this.getval(11, effect, ["changefunc", "keys", "values", "triggers", "timerval"]);
    var n = triggers.indexOf(trgr);//check that trigger is good
    if (n === -1) continue;
    var reversal = await this.getproperty(4, changefunc, "replace");
    efn[reversal](key, target, value, obj);//create execution function
  }
   }
        
      
  },
  
  sumstring: async function(a){
    let string = a;//the string that requires chopping and adding
    var x = 0;
    console.log(string);
    return new Promise(resolve => {
      let stringsplit = string.split(',');
      var y = stringsplit[0];
      for (var i = 0; i < stringsplit.length; i++){
       x += +stringsplit[i];
      };
       console.log(x + ' base stat = ' + y);
       resolve ([x,y]);
    })
  },
  
  hpresolve: async function (a, b){
    var target = a;
    var healthchange = parseInt(b);
    var [hp, maxhp, soak] = await this.getval(2, target, ['hp','maxhp','soak']);
    var hpcheck = +hp + +healthchange;
    if (+hpcheck < hp) healthchange = +healthchange + +soak;
    var newhp = +hp + +healthchange;
    if (+newhp > +maxhp) newhp = maxhp;
    this.setval(2, target, ['hp'], [newhp]);
  },
  
  eventsetval: async function(b, c, d){
     let searchval = parseInt(b);
     let keys = c;
     let values = d;
  

   eventdoc.getRows(1, {'query': 'label = ' + searchval},function(err,row){
      if (err) console.log(err);
        
     for (var i = 0; i < keys.length; i++){
        let key = keys[i];
        let value = values[i]
        row[0][key] = value;
     }
        row[0].save();
        return;
    })
    },
  
  eventgetval: async function(b, c){
     let searchval = parseInt(b);
     let keys = c;
     var x = []
  return new Promise(resolve => {
   eventdoc.getRows(1, {'query': 'label = ' + searchval},function(err,row){
      if (err) console.log(err);
      
     for (var z = 0; z < keys.length; z++){
        let key = keys[z];
        x[z] = row[0][key];
     }
    resolve (x);
    })
  })
    },
  
 dmcooldownreset: async function(a, b, c){
   var cmd = a;
   var cooldownpull = b;
   var char = c;
   return new Promise(resolve => {
   var cooldowns = cooldownpull.split(',');
   var timestamp;
   for (var i = 0; i < cooldowns.length; i++){
   var cooldown = cooldowns[i];
    console.log(cooldown);
  if (cooldown === '') continue;
   var m = cooldown.indexOf(cmd);
   if (m === -1) continue;
   var [commandgen,time] = cooldown.split('|');
   timestamp = new Date(time);
   var cooldownend = new Date(timestamp.getTime() + 5*60000);
   var now = new Date();
    var q;
   if (now > cooldownend) {
     var cooldownstring = (cooldown+',');
     var cooldownreset = cooldownpull.replace(cooldownstring,'');
     var newcooldowns = (cooldownreset + cmd + '|' + now + ',');
     this.setval(2, char, ['cooldowns'], [newcooldowns]);
     q = 1;
     }else{q = 0};
     return resolve(q);
    };
  })
 },
  
  eventcdcheck: async function(a,b){
    console.log('Checking event log.');
    var checkval = a;
    var roomid = parseInt(b);
    console.log('checkval = ' + checkval + '; roomid = ' + roomid);
    var hasacted = await this.eventproperty(roomid,'hasacted');
    var stage = await this.eventproperty(roomid,'roundstage');
    return new Promise(resolve => {
      var x;  
      var h = hasacted.indexOf(checkval);
      x = 1;
      console.log('h= ' + h + '; stage = ' + stage);
      if (h != -1 || stage != '1') x = 0;
      resolve (x);
    })
  },
  
  eventproperty: async function (a, b){
    var roomlabel = parseInt(a);
    var key = b;
    console.log('room = ' + roomlabel);
    return new Promise(resolve => {
      doc.getRows(7, {'query': 'label = ' + roomlabel},function(err,row){
        var x;
       if (!row[0]) {x = "none";
                     return resolve (x);
                    };
        x = row[0][key];
        resolve(x)
      });
    });
  },
  
  eventmodifyval: async function (a, b, c){
    var searchval = parseInt(a);
    var keys = b;
    var values = c;
    
    doc.getRows(7, {'query': 'label = ' + searchval},function(err,row){
      if (err) console.log(err);
        
     for (var i = 0; i < keys.length; i++){
        let key = keys[i];
        let value = values[i]
        row[0][key] = value;
     }
        row[0].save();
        return;
    })
  },
  
    eventvalues: async function(b, c){
     let searchval = parseInt(b);
     let keys = c;
     var x = []
  return new Promise(resolve => {
   doc.getRows(7, {'query': 'label = ' + searchval},function(err,row){
      if (err) console.log(err);
      console.log('pull = '+row[0])
     for (var z = 0; z < keys.length; z++){
        let key = keys[z];
        x[z] = row[0][key];
     }
    resolve (x);
    })
  })
    },
  
}