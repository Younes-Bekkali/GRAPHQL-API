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
database: "JackieLai"
});

/*
const { Client }  = require('pg');
const client = new Client({
    user: '',
    host: 'localhost',
    database: '',
    password: '',
    port: 5432
});
*/

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
        buildings(id: Int!): buildings
        customers(id: Int!): Customer
        employees(id: Int!): Employee
        building_details(id: Int!): building_details
    }
    type Intervention {
        building_id: Int!
        start_date_time: String!
        end_date_time: String
        buildings: [buildings]
    }
    type buildings {
        id: Int!
        admin_full_name: String
        address_id: [Address]
        customer_id: [Customer]
        interventions: [Intervention]
        building_details: building_details
        
    }
    
    type Address {
        entity: Int!
        type_of_address: String
        status: String
        number_n_street: String
        street_name: String
        suite_or_apt: String
        city: String
        postal_code: String
        country: String
        address_notes: String
    }
    type Customer {
        id: Int!
        company_name: String
        name_company_contact: String
        buildings: [buildings]
    }
    type Employee {
        id: Int!
        first_name: String
        last_name: String
        email: String
        buildings: [buildings]
        intervention: [Intervention]
    }
    type building_details {
        id: Int!
        building_id: Int!
        info_key: String
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
    addresses: getAddress,
};

async function getAddress({ id }) {
    const res1 = await querypg('SELECT * FROM fact_intervention where id = ' + id + ';');
    const rest2 = await query('SELECT * FROM addresses JOIN buildings ON buildings.address_id = addresses.id WHERE buildings.id = ' + res1['rows'][0].building_id);

    const intervention = res1.rows[0];

    intervention['address'] = rest2[0]
    return intervention;

};

async function getInterventions({building_id}) {
    var interventions = await query('SELECT * FROM factinterventions WHERE building_id = ' +building_id )
    return interventions[0]
};

async function getBuildings({id}) {
    var buildings = await query('SELECT * FROM buildings WHERE id = ' +id )
    return buildings[0]
};

async function getCustomers({ id }) {
    const res1 = await querypg('SELECT * FROM fact_intervention where building_id = ' + id);
    const res2 = await query('SELECT buildings.id, buildings.building_name, customers.name_company_contact, customers.company_name, customers.company_phone, customers.contact_email FROM buildings INNER JOIN customers ON buildings.customer_id = customers.id WHERE buildings.id = ' + id)
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

async function getCustomers({id}) {
    var customers = await query('SELECT * FROM customers WHERE id = ' +id )
    return customers[0]
};


async function getEmployees({ id }) {
    const res1 = await query('SELECT * FROM employees WHERE id = ' + id)
    const res2 = await querypg('SELECT * FROM fact_intervention WHERE employee_id = ' + id)

   
    var buildingIDList = []

    //Get list of buildings ID
    res2.rows.forEach(function (building) {
        buildingIDList.push(building.building_id)
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

async function getEmployees({id}) {
    var employees = await query('SELECT * FROM employees WHERE id = ' +id )
    return employees[0]
};

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




// Create an express server and a GraphQL endpoint
var app = express();
app.use('/graphql', express_graphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

app.listen(4000, () => console.log('Express graphQL server now running on localhost:4000/graphql'));