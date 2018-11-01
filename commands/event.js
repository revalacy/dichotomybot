const async = require ('async');
const GoogleSpreadsheet = require('google-spreadsheet');
    const creds = require('./../client_secret.json');
    const doc = new GoogleSpreadsheet('1kxcMdb0Gsyg9Oe3NbWMXx1vHopFjqLzneXehoURAN6M');//Character database
    const eventdoc = new GoogleSpreadsheet('1fuXzJ1_rvlHIFRRwTZXfnDrxzyn2yrvukXe0Th_i8-8');//events database
    doc.useServiceAccountAuth(creds, function (err) {
    if (err)
    console.log(err)});
    eventdoc.useServiceAccountAuth(creds, function (err) {
    if (err)
    console.log(err)});

const fn = require ('./../functions.js');
var efn = require ('./../effects.js');

exports.run = (client, message, [idlabel, action, ...args]) => {
  
   
  if (!idlabel) return message.channel.send('You must include the event id in your command!');
  
  var eventid = idlabel.toString();
  console.log(eventid + ' ' + typeof eventid);
  var announcements = client.channels.get('190551151706505217');
  var gneventroom = client.channels.get('503634158308818954');
  var regchannel = client.channels.get('254740468867268608');
  //Arguments: Name, Target, Object
  let members = message.guild.roles.find(role => role.name === "Glass Network Members");

async function resolve(){
  
  //get all event variables for possible use
  
  var [title, state, starttime, gmlist, eventroom, set, registered, startmsg, endmsg, blurb, locatedin] = await fn.eventgetval(eventid, ['title','state','starttime','gms','room','set','registered','startmsg','endmsg', 'blurb','locatedin']);

  var rollingroom = client.channels.get(eventroom);
  var locationname = await fn.getproperty(8, set, 'friendlyname');
  console.log(eventroom);
  
  if (action === 'open'){//begins the event start process, puts it into active mode. requires date parameter to be added to event before start can initiate. Announces event is available for registration, gives event details and command to register, explains 'you may register even if you aren't sure if you can attend'; sets round to 0
        if (starttime === '' ) return message.channel.send('You must have a start time listed before registration can be opened!');
        fn.eventsetval(eventid, ['label','state','round'],[eventid,'setup',0]); // change state to setup, round to 0
        var registrationmsg = ('A new event has been posted! Registration has now opened for: **' + title + '**. Details of the event and the registration command you will need to enter can be found in #event_announcements_and_registration. Event announcements are pinned to ensure they can be found easily. See you there!');//post a message to the gn event coordinating channel
        
        var announcementmsg = ('**Event Name:** ' + title + '\n**GM(s):** ' + gmlist +  '\n**Discord Room:** ' + rollingroom + '\n**IC Starting Location:** ' + locationname + '\n**This event will be held:** ' + starttime + '\n' + blurb + '\n\n*To register for this event, use the following command in ' + regchannel +':* `/register Yourname ' + eventid +'`\n\n');

        announcements.send(registrationmsg);//send announcement

        gneventroom.send(announcementmsg).then((newMessage) => {newMessage.pin();});//post the message to the event announcements channel and pin it
  
  };
  if (action === 'advance'){//advances the round's stage. Stage 1 = action, stage 2 = npcs, stage 3 = reaction, stage 3 => round +1 stage 1 again
    var list = ('Enambris,Sariel,Luke,Nivia,Pitch,Stablehand,Lurker,Harbinger,Shaman,Wanderer,Hunter,Villager,Stalker,Doctor,Trapper,Adjutant,Educator,Seeker,Bo,Bear,');   
    var participants = list.split(',');
    console.log(participants);
                for (var i = 0; i < participants.length; i++) {
                      var participant = participants[i];
                      if (participant === '') continue;
                  console.log(participant);
                      var damagestring = await fn.getproperty(2, participant, 'damages');
                      var attacks = damagestring.split(',');
                      for (var y = 0; y < attacks.length; y++){
                            var attack = attacks[y];
                            if (attack === '') continue;
                            var [attacker, attackroll, damage] = attack.split(' | ');
                            await fn.hpresolve(participant, damage);
                          
                      };
                      await fn.setval(2, participant, ['damages'],['']);
                }};
               
  
  if (action === 'add'){//adds a property to the existing event settings. command flow /event # add key value
      var key = args[0];
      var value = args[1];
      var oldval = await fn.eventgetval(eventid,[key]);
      var newval = (oldval + ',' + newval);
      fn.eventsetval(eventid, [key],[newval]);
  };
  
  if (action === 'change'){//changes a property of the existing event settings. command flow /event # change key value
    var key = args[0];
    var value = args[1];
    fn.eventsetval(eventid, [key],[value]);
  };
  
  if (action === 'start'){//begins the event, sends the start message, sets first round to 1 and round stage to 1, pulls registration list and populates tracking data to index
    if (startmsg === '') return message.channel.send('A start message must be added to the event settings before the event can start.');
    if (state != 'setup') return message.channel.send('You must open the event to registration before you can start it!');
    if (state === 'active') return message.channel.send('That event is already active!'); 
    fn.eventsetval(eventid, ['state'],['active']);//set state as Active
    fn.eventmodifyval(eventroom, ['evendindex','registered','round','roundstage'],[eventid,registered, 1, 1]);
    await rollingroom.send(startmsg);//send event's starting message
    var participants = registered.split(',');
    for (var j = 0; j < participants.length; j++){
      var person = participants[j];
      if (person === '') continue;
      var eventlist = await fn.getproperty(2, person, 'inevent');
      if (eventlist === '0') eventlist = '';
      var newlist = (eventlist + eventid + ',');
      fn.setval(2,person,['inevent'],[newlist]);
    };
    await message.channel.send('```The event ' + title + ' has now begun! Round 1 start, you may now declare actions and emote them. When the round ends, the GMs will respond, and afterwards time will be allowed for /defense and /cover reactions if necessary.```');
  };
  if (action === 'end'){//ends the event, sends the end message, clears tracking page, sets state to 'ended' for later historical archiving
      rollingroom.send(endmsg);
      fn.eventsetval(eventid,['state'],['ended']);//set state to ended, clears tracker index value
      //removes event id from all participants
      //remove event role from all participants' owners
  };
  if (action === 'send'){//pull the room ID being used for rolls and send the indicated message; command flow /event # send ...text-to-send
    var sendtext = args.join(' ');
    rollingroom.send(sendtext);
  };
}
  

  resolve();
  
}