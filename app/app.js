function calculate_time(data,client,flag){
  var startflag=0;
  var eventCallback = function (event) {
         var ParsedTimerToggleData = event.helper.getData();
    var id_string = ParsedTimerToggleData.id.toString();
    var time;
    client.db.get(ParsedTimerToggleData.ticket_id).then (
      function(data) {
        data[id_string] = ParsedTimerToggleData.time_spent;
        client.db.set( ParsedTimerToggleData.ticket_id, data);
        if(flag==1)statuschange(client);
      },
      function(error) {
        if(error.status == 404){
          console.log("V2 err");
          client.data.get("company").then (
            function(companydata) {
              var id=companydata.company.id;
          client.db.get("ticket:id").then(
            function(datatime){
          var setData = {};
          setData[id_string] = ParsedTimerToggleData.time_spent-datatime.time;
          time=ParsedTimerToggleData.time_spent;
          client.db.set( ParsedTimerToggleData.ticket_id, setData);
          client.db.set("ticket:id",{"time":time})
          if(flag==1)statuschange(client);
        },
        function(error)
        {
          var setData = {};
          setData[id_string] = ParsedTimerToggleData.time_spent;
          time=ParsedTimerToggleData.time_spent;
          client.db.set( ParsedTimerToggleData.ticket_id, setData)
          client.db.set("ticket:id",{"time":time})
          if(flag==1)statuschange(client);
        }
      );

            })
}})
  }
  var eventstartCallback = function (event) {
    var ParsedTimerToggleData = event.helper.getData();
     if(ParsedTimerToggleData.timer_running==false)
     {
    var id_string = ParsedTimerToggleData.id.toString();
    var time;
    client.db.get(ParsedTimerToggleData.ticket_id).then (
      function(data) {
        data[id_string] = ParsedTimerToggleData.time_spent;
        client.db.set( ParsedTimerToggleData.ticket_id, data);
        if(flag==1)statuschange(client);
      },
      function(error) {
        if(error.status == 404){
          if(startflag==0){
          startflag=1;
          client.data.get("company").then (
            function(companydata) {
              var id=companydata.company.id;
          client.db.get("ticket:id").then(
            function(datatime){
             var setData = {};
          if(flag==1){
          setData[id_string] = ParsedTimerToggleData.time_spent;
          time=ParsedTimerToggleData.time_spent+datatime.time;
          client.db.set( ParsedTimerToggleData.ticket_id, setData);
          client.db.set("ticket:id",{"time":time})
          
             statuschange(client);
        }},
        function(error)
        {
          var setData = {};
          setData[id_string] = ParsedTimerToggleData.time_spent;
          time=ParsedTimerToggleData.time_spent;
          client.db.set( ParsedTimerToggleData.ticket_id, setData)
          client.db.set("ticket:id",{"time":time})
          if(flag==1)statuschange(client);
        }
      );

            })
}}})
  }
}
  
  

  client.events.on("ticket.stopTimer", eventCallback);
 client.events.on("ticket.startTimer", eventstartCallback);

}

function alert_agent(client,data,iparams){
  var companyUrl = "https://"+iparams.subdomain+".freshdesk.com/api/v2/companies/"+data.company.id;
  var companyOptions = {
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': '<%=  encode(iparam.apikey) %>'
    }
  };
  client.request.get(companyUrl,companyOptions)
  .then(function(companyData){
    var parsedCompanyData = JSON.parse(companyData.response);
    var split_hr_min = parsedCompanyData.custom_fields.contract_time.split(".");
    var in_mins = Math.round(60*(split_hr_min[1]/100));
    if(parseInt(parsedCompanyData.custom_fields.contract_time) < parseInt(iparams.alertAgentHours)){
      $("#alerttext").text("Remaining contract hours : " + split_hr_min[0] + " hours and " + (in_mins ? in_mins : "00") +" minutes");
    }
    else
    {
      $("#alerttextgreen").text("Remaining contract hours : " + split_hr_min[0] + " hours and " + (in_mins ? in_mins : "00") +" minutes");
    }
  },
  function(error){
    $('#apptext').text("Error in fetching company data [agent] - " + error.response);
  });
}


function minus_remaining_hours (client,ticketData,iparams,companyapiData, companyData){
  client.db.get(ticketData.ticket.id).then (
  function(data) {
    //console.log
    var updateData = [];
    updateData[0] = 0;
    updateData[1] = 0;
    $.each(data, function(key, value){
      if(value > 59){
        var mins = value/60;
        if(mins > 59){
          var hrs = mins/60;
          var mins = mins % 60;
          updateData[0] += hrs; 
          updateData[1] += mins;
        }else{
          updateData[0] += 0;
          updateData[1] += mins;
        }
      }
    });
    var time_spent_data = updateData[0] + parseInt(updateData[1])/60;
    //console.log(updateData[0]);
    //console.log((updateData[1])/60);
  
    var remaining_hours = parseFloat(JSON.parse(companyapiData.response).custom_fields.contract_time).toFixed(2) - time_spent_data;
    var fixed_two_time = remaining_hours.toFixed(2);
    console.log(fixed_two_time);
    var companyupdateURL = "https://"+iparams.subdomain+".freshdesk.com/api/v2/companies/"+companyData.company.id ;
    var companyUpdateOptions = {
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': '<%=  encode(iparam.apikey) %>'
      },
      body: JSON.stringify({custom_fields :{contract_time : fixed_two_time.toString() }})
    };
    client.request.put(companyupdateURL, companyUpdateOptions)
    .then(function(){
      client.db.delete(ticketData.ticket.id);
      client.interface.trigger("showNotify", {type: "success", message: "Updated contract hours for " + companyData.company.name});
      $('#appupdate').text("Contract time has been updated! please refresh the page to see the updated time.");
    },function(updatecompanyErr){
      $('#apptext').text("Error in updating company data - " + updatecompanyErr.response);
    });
  },function(error){
    $('#apptext').text("Internal app error! Please reload the app - " + error.message);
  });
}

function statuschange(client){
      client.data.get("company")
      .then(function(companyData){
        client.iparams.get()
        .then(function(iparams){
          client.data.get("ticket")
          .then(function(ticketData){
            var timerOptions = {
              headers: {
                'Content-Type' : 'application/json',
                'Authorization': '<%=  encode(iparam.apikey) %>'
              }
            };
            var companyURL = "https://"+iparams.subdomain+".freshdesk.com/api/v2/companies/"+companyData.company.id ;
            client.request.get(companyURL, timerOptions )
            .then(function(companyapiData){
             minus_remaining_hours (client,ticketData,iparams,companyapiData, companyData);
           },function(companyapiErr){
            $('#apptext').text("Error in fetching company data - " + companyapiErr.response);
          });
          },function(ticketDataErr){
            $('#apptext').text("Error in fetching ticket data - " + ticketDataErr.message);
          });

        },function(iparamserror){
          $('#apptext').text("Error in fetching iparams - " + iparamserror.message);
        });
      }, function(companyErr){
        $('#apptext').text("Error in fetching company data - " + companyErr.message);
      });
    }




 function check_monthly_renewal(client,data,iparams){
   var flag;
  var companyUrl = "https://"+iparams.subdomain+".freshdesk.com/api/v2/companies/"+data.company.id;
  var companyOptions = {
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': '<%=  encode(iparam.apikey) %>'
    }
  };
  client.request.get(companyUrl,companyOptions)
  .then(function(companyData){
    var parsedCompanyData = JSON.parse(companyData.response);
    var id=parsedCompanyData.id;
    var contract_hrs=parsedCompanyData.custom_fields.contract_time;
   // console.log(contract_hrs);
   // console.log(id);
    //console.log(parsedCompanyData);
      var today = new Date();
     var dd = today.getDate();
    
    if(dd==24){
      client.db.get("companyi:id").then (
        function(dbflag){
          flag=dbflag.flag;
          //console.log("flag");
          //console.log(flag);
        },
        function(error){
        flag=0;
        }
      )
       
      client.db.get("company:id").then (
        function(dbdata){
          if(flag==0){

          // console.log(dbdata.flag); 
            //if(flag==0){
             client.db.get("ticket:id").then (
               function(data) {
                 
                var remaining_hours = contract_hrs;
                console.log(dbdata.contract_time);
                

          var fixed_two_time=Number(dbdata.contract_time)+Number(remaining_hours);
          console.log(fixed_two_time);
          var companyupdateURL = "https://"+iparams.subdomain+".freshdesk.com/api/v2/companies/"+id ;
          var companyUpdateOptions = {
            headers: {
              'Content-Type' : 'application/json',
              'Authorization': '<%=  encode(iparam.apikey) %>'
            },
            body: JSON.stringify({custom_fields :{contract_time : fixed_two_time.toString() }})
          };
          client.request.put(companyupdateURL, companyUpdateOptions)  
          .then(function(){
            //flag=1;
            client.interface.trigger("showNotify", {type: "success", message: "Contract hours been Renewed. Please Refresh The page"});
            client.db.set("companyi:id",{"flag":1})//.then(
              //function(dat){
              //  console.log(dat);
              //}
            //)
          })
               })
        }},
      
         
         //console.log("suc");
       
      
      function(error) {
        /* if(error.status==404){
         //console.log("hello");
         client.db.set("company:id",{"contract_time":contract_hrs}).then(
           function(data){
             console.log(data);
           }
         )
       }*/
       }
    )
  }
else {
  client.db.set("companyi:id",{"flag":0})
}


})
     


 
 }

 function set_contract_hours(client,data,iparams){
  var companyUrl = "https://"+iparams.subdomain+".freshdesk.com/api/v2/companies/"+data.company.id;
  var companyOptions = {
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': '<%=  encode(iparam.apikey) %>'
    }
  };
  client.request.get(companyUrl,companyOptions)
  .then(function(companyData){
    var parsedCompanyData = JSON.parse(companyData.response);
    var id=parsedCompanyData.id;
    var contract_hrs=parsedCompanyData.custom_fields.contract_time;
    client.db.get("company:id").then (
      function(success){

      },
      function(error){
        if(error.status==404){
          //console.log("hello");
          client.db.set("company:id",{"contract_time":contract_hrs}).then(
            function(data){
              console.log(data);
            }
          )
        }        
      }
    )  
 })
}


$(document).ready( function() {
  app.initialized()
  .then(function(_client) {
    var client = _client;
    client.events.on('app.activated',
      function() {
        $("#apptext").empty();
        $("#alerttext").empty();
        $("#alerttextgreen").empty();
        $("#appupdate").empty();
        client.data.get("company").then (
          function(data) {
            if(!$.isEmptyObject(data.company))
            {
              client.iparams.get()
              .then(function(iparams){
                var company_string = data.company.id.toString();
                if(iparams.companies.includes(company_string))
                {
                  set_contract_hours(client,data,iparams);
                check_monthly_renewal(client,data,iparams)
                  alert_agent(client,data,iparams);
                  calculate_time(data,client,0);
                }else{
                  $('#apptext').text("Company not present under contract");
                }
              },
              function(iparamserror){
                $('#apptext').text("Error in fetching iparams - " + iparamserror.message);
              });
            }else{
              $('#apptext').text("Company not linked to the contact");
            }
          },
          function(error) {
            $('#apptext').text("Error in fetching company data - " + error.message);
          });
      });
    client.data.get("company").then (
      function(data) {
        calculate_time(data,client,1);
      },function(error){
        $('#apptext').text("Error in fetching company data - " + error.message);
      });
  });
});
