var express = require('express');
var express_graphql = require('express-graphql');
var {buildSchema} = require('graphql');
// const { GraphQLObjectType, GraphQLString, GraphQLList  } = graphql;
// var query = require('./sql.js');

const { Client } = require('pg');
const client = new Client({
user: 'codeboxx',
host: 'codeboxx-postgresql.cq6zrczewpu2.us-east-1.rds.amazonaws.com',
database: 'ukemeekpenyong',
password: 'Codeboxx1!',
}); var mysql = require('mysql');
const con = mysql.createConnection({
host: 'codeboxx.cq6zrczewpu2.us-east-1.rds.amazonaws.com',
user: "codeboxx",
password: "Codeboxx1!",
database: "ukemeekpenyong"
});


//con.connect();
/*
function query(queryString) {
    return new Promise((resolve, reject) => {
        connection.query(queryString, function(err, result) {
            if (err) {
                return reject(err);
            } 
            return resolve(result)
        })
    })
}
*/
//module.exports = query


client.connect(function(error){
    if (!!error) {
        console.log("Unable to connect to PSQL database.")
    } else {
        console.log("You are connected to PSQL database.")
    }
});

/*var mysql = require('mysql');
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "JackieLai"
});
*/
con.connect(function(error){
    if (!!error) {
        console.log("Unable to connect to mySQL database.");
    } else {
        console.log("You are connected to mySQL database.");
    }
});

// GraphQL Schema
// type Query is special schema root type, this is the entry point for the client request.
// address: Address! belongs to one address
// customer: Customer! belongs to one customer
// interventions: [Intervention] belongs to many intervention

var schema = buildSchema(`
    type Query {
        fact_intervention(building_id: Int!): Intervention
        buildings(id: Int!): Building
        customers(id: Int!): Customer
        employees(id: Int!): Employee
        building_details(id: Int!): Building_detail
    }
    type Intervention {
        building_id: Int!
        start_date_time_intervention: String!
        end_date_time_intervention: String
        buildings: [Building]
    }
    type Building {
        id: Int!
        entity_id: Int!
        building_administrator_full_name: String
        addresses: [Address]
        customer: Customer
        interventions: [Intervention]
        building_details: Building_detail
        
    }
    
    type Address {
        entity_id: Int!
        address_type: String
        address_status: String
        street_number: String
        street_name: String
        suite_or_apartment: String
        city: String
        postal_code: String
        country: String
        address_notes: String
    }
    type Customer {
        id: Int!
        company_name: String
        company_contact_full_name: String
        building: [Building]
    }
    type Employee {
        id: Int!
        firstname: String
        lastname: String
        email: String
        function: String
        building: [Building]
        intervention: [Intervention]
    }
    type Building_detail {
        id: Int!
        building_id: Int!
        information_key: String
        value: String
    }
`);

// Root Resolver, list of the queries and assign the function which is executed
var root = {
    factinterventions: getInterventions,
    buildings: getBuildings,
    customers: getCustomers,
    employees: getEmployees,
    building_details: getBuildingDetails,
    //addresses: getAddress,
};
/*
async function getAddress({ id }) {
    const res1 = await querypg('SELECT * FROM factintervention where id = ' + id + ';');
    const rest2 = await query('SELECT * FROM addresses JOIN buildings ON buildings.address_id = addresses.id WHERE buildings.id = ' + res1['rows'][0].buildingid);

    const intervention = res1.rows[0];

    intervention['address'] = rest2[0]
    return intervention;

};
*/
async function getCustomers({ id }) {
    const res1 = await querypg('SELECT * FROM factintervention where buildingid = ' + id);
    const res2 = await query('SELECT buildings.id, buildings.building_name, customers.contact_full_name, customers.business_name, customers.contact_phone, customers.contact_email FROM buildings INNER JOIN customers ON buildings.customer_id = customers.id WHERE buildings.id = ' + id)
    const res3 = await query('SELECT * FROM buildings where id =' + id);
    //Extract informations from response object
    const interventions = res1.rows;
    const customer = res2[0];
    const building = res3[0];


    // //Add address values to Address type of Intervention
    building['customer'] = customer;
    building['interventions'] = interventions;
    return building;
};



//Function for getting unique value
// See this web site
// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}





async function getEmployees({ id }) {
    const res1 = await query('SELECT * FROM employees WHERE id = ' + id)
    const res2 = await querypg('SELECT * FROM factintervention WHERE employeeid = ' + id)

   
    var buildingIDList = []

    //Get list of buildings ID
    res2.rows.forEach(function (building) {
        buildingIDList.push(building.buildingid)
    })    

    
    //Filters buildingIDList to get unique value
    var filteredBuildingList = buildingIDList.filter(onlyUnique);
   

    //Change building list into string for SQL
    StringedBuildings = filteredBuildingList.join();    

    //Get required buildings infos
    buildings = await query('SELECT * FROM buildings WHERE id IN (' + StringedBuildings + ')')

    //Get building details
    building_details = await query('SELECT * FROM building_details WHERE building_id IN (' + StringedBuildings + ')')
    

    //Extract informations from response object
    const employee = res1[0];
    
    employee['interventions'] = res2.rows;
    employee['building'] = buildings;
    employee['building_details'] = building_details;   

    return employee;
};

/*var root = {
    intervention: getAddress,
    building: getCustomer,
    employee: getEmployeeInterventions

};*/

/*/Create an express server and a GraphQL endpoint
var app = express();
app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}));
*/

async function getInterventions({building_id}) {
    var interventions = await query('SELECT * FROM factinterventions WHERE building_id = ' +building_id )
    return interventions[0]
};

async function getBuildings({id}) {
    var buildings = await query('SELECT * FROM buildings WHERE id = ' +id )
    return buildings[0]
};
/*
async function getCustomers({id}) {
    var customers = await query('SELECT * FROM customers WHERE id = ' +id )
    return customers[0]
};

async function getEmployees({id}) {
    var employees = await query('SELECT * FROM employees WHERE id = ' +id )
    return employees[0]
};
*/
async function getBuildingDetails({id}) {
    var buildingdetails = await query('SELECT * FROM building_details WHERE id = ' +id )
    return buildingdetails[0]
};

// define what is query
function query(queryString) {
    console.log(queryString)
    return new Promise((resolve, reject) => {
        con.query(queryString, function(err, result) {
            if (err) {
                return reject(err);
            } 
            return resolve(result)
        })
    })
};

// async function getInterventions() {
//     console.log("Sending Query...")
//     var factintervention = await querypg('SELECT * FROM factintervention WHERE employee_id = 341')
//     // for (var i = 0; i < rows.length; i++) {
//     //     var row = rows[i];
//     //     console.log(row.status);
//     // }
//     console.log("============== RETURNING OBJECT ===================")
//     console.log(factintervention.rows)
//     console.log("============== RETURNING FIELDS ===================")
//     console.log("")
//     console.log("===================================================")
//     return factintervention
// };

function querypg(queryString) {
    console.log("Hi! - PostGres -")
    console.log(queryString)
    return new Promise((resolve, reject) => {
        client.query(queryString, function(err, result) {
            if (err) {
                console.log("error!", err)
                return reject(err);
            }
            console.log("result!", result)
            return resolve(result)
        })
    })
};
/*
function pgconnection() {
    return new Promise((resolve, reject) => {
        client.connect(function(err, result) {
            if (err) {
                return reject(err);
            }
            return resolve(result)
        })
    })
} 

function pgquery(queryString) {
    return new Promise((resolve, reject) => {
        client.query(queryString,function(err, result){
            if (err) {
                return reject(err);
            }
            return resolve(result);
        })
    })
}
*/

// Create an express server and a GraphQL endpoint
var app = express();
app.use('/graphql', express_graphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

//pgconnection();
//querypg();
app.listen(4000, () => console.log('Express graphQL server now running on localhost:4000/graphql'));