const express = require("express");
const needle = require("needle");
const app = express();

app.use(async function(request, response){
    //получение пивоварнь из апи
    let breweriesAPI = await getBreweriesAPI();
    //создание массива объектов Brewery
    let breweries = getBreweries(breweriesAPI);
    //Составить на базе полученных данных объект, в котором в качестве ключей будут выступать названия штатов, а в качестве значений - массив пивоварен
    let map = getMap(breweries);
    //Вывести в HTTP-ответ для каждого штата список адресов пивоварен, которые находятся в этом штате
    //response.send(makeResponse1(map));
    //Отфильтровать список пивоварен, отсеять все микропивоварни (type = ‘micro’)
    let filterBreweries = filterBrew(breweries);
    //Вывести в HTTP-ответ таблицу из отфильтрованных пивоварен
    //response.send(makeResponse2(filterBreweries));
    //вывести все сразу
    response.send(makeResponse1(map)+makeResponse2(filterBreweries));

});
app.listen(3000);

class Brewery {
    constructor(brewery) {
        this.id=brewery.id;
        this.name=brewery.name;
        this.brewery_type=brewery.brewery_type;
        this.street=brewery.street;
        this.city=brewery.city;
        this.state=brewery.state;
        this.postal_code=brewery.postal_code;
        this.country=brewery.country;
        this.longitude=brewery.longitude;
        this.latitude=brewery.latitude;
        this.phone=brewery.phone;
        this.website_url=brewery.website_url;
        this.updated_at=brewery.updated_at;
        this.tag_list=brewery.tag_list;
    }
    getFullAddress(){
        //return {postal_code:this.postal_code, country:this.country, state:this.state, city:this.city, street:this.street};
        return "почтовый индекс: "+this.postal_code+", страна: "+this.country+", штат: "+this.state+", город: "+this.city+", улица: "+this.street;
    }
}

async function getBreweriesAPI() {
    try{
        let url = "https://api.openbrewerydb.org/breweries";
        let resp = await needle('get', url);
        return resp.body;
    }catch(e){
        console.log(e);
    }
    
}

function getBreweries(breweriesAPI){
    let breweries = [];
    for(brewery of breweriesAPI){
        breweries.push(new Brewery(brewery));
    }
    return breweries;
}

function getMap(breweries){
    let map = new Map();
    for(brewery1 of breweries){
        let state = brewery1.state;
        if(!map.has(state)){
            let breweriesState = [];
            for(brewery2 of breweries){
                if(brewery2.state==state){
                    breweriesState.push(brewery2);
                }
            }
            map.set(state, breweriesState);
        }
    }
    return map;
}

function makeResponse1(map){
    let resp = [];
    let respString = "";
    for(state of map.keys()){
        let listAddr = [];
        respString += state + "</br>"; 
        for(brew of map.get(state)){
            listAddr.push(brew.getFullAddress());
            respString += brew.getFullAddress() + "</br>"; 
        }
        resp.push({state:state, addresses:listAddr});
    }
    //return JSON.stringify(resp);
    return respString;
}

function filterBrew(breweries){
    let filterBreweries = [];
    for(brew of breweries){
        if(brew.brewery_type!='micro'){
            filterBreweries.push(brew);
        }
    }
    return filterBreweries;
}

function makeResponse2(filterBreweries){
    let table = "<table border=1>"
    table += "<tr>";
    table += "<th>идентификатор</th><th>название</th><th>полный адрес</th><th>телефон</th><th>адрес сайта</th>";
    table += "</tr>";
    for(brew of filterBreweries){
        table += "<tr>";
        table += "<td>"+brew.id+"</td>";
        table += "<td>"+brew.name+"</td>";
        table += "<td>"+brew.getFullAddress()+"</td>";
        table += "<td>"+brew.phone+"</td>";
        table += "<td>"+brew.website_url+"</td>";
        table += "</tr>";
    }
    table += "</table>"
    return table;
}