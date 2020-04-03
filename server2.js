const express = require('express')
const graphqlHTTP = require('express-graphql')
const graphql = require('graphql')
// translates the users GraphQL queries to SQL statements 
const joinMonster = require('join-monster')
// Simple SQL escape and format for MySQL
// var SqlString = require('sqlstring')

// postgresql connection
const { Client } = require('pg')
const client = new Client({
  host: "",
  user: "",
  password: "",
  database: ""
})
client.connect(function(error){
    if (!!error) {
        console.log("Unable to connect to PSQL database.")
    } else {
        console.log("You are connected to PSQL database.")
    }
});

// mysql connection
var mysql = require('mysql')
const con = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: ""
});

con.connect(function(error){
    if (!!error) {
        console.log("Unable to connect to mySQL database.")
    } else {
        console.log("You are connected to mySQL database.")
    }
});

// create the schema
// const QueryRoot defines all the fields can be queried at the first level
const QueryRoot = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        hello: {
            type: graphql.GraphQLString,
            resolve: () => "Hello world!"
        },

        interventions: {
            type: new graphql.GraphQLList(Intervention),
            resolve: (parent, args, context, resolveInfo) => {
              return joinMonster.default(resolveInfo, {}, sql => {
                return client.query(sql)
              })
            }
        },

        intervention: {
            type: Intervention,
            args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
            where: (factinterventionTable, args, context) => `${factinterventionTable}.building_id = ${args.id}`,
            resolve: (parent, args, context, resolveInfo) => {
            return joinMonster.default(resolveInfo, {}, sql => {
                return client.query(sql)
                })
            }
        },


        buildings: {
            type: new graphql.GraphQLList(Building),
            resolve: (parent, args, context, resolveInfo) => {
              return joinMonster.default(resolveInfo, {}, sql => {
                return con.query(sql)
                })
            }
        },

        building: {
            type: Building,
            args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
            where: (buildingsTable, args, context) => `${buildingsTable}.id = ${args.id}`,
            resolve: (parent, args, context, resolveInfo) => {
            return joinMonster.default(resolveInfo, {}, sql => {
                console.log(sql)
                return con.query(sql)
                })
            }
        },

        employees: {
            type: new graphql.GraphQLList(Employee),
            resolve: (parent, args, context, resolveInfo) => {
              return joinMonster.default(resolveInfo, {}, sql => {
                return con.query(sql)
              })
            }
        },

        employee: {
            type: Employee,
            args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
            where: (employeesTable, args, context) => `${employeesTable}.id = ${args.id}`,
            resolve: (parent, args, context, resolveInfo) => {
            return joinMonster.default(resolveInfo, {}, sql => {
                return con.query(sql)
                })
            }
        },
    })


  })

// DEFINE THE NEW TYPES: Intervention, Building, Address, Customer, Employee, Building_detail
    const Intervention = new graphql.GraphQLObjectType({
        name: 'Intervention',
        fields: () => ({
        building_id: { type: graphql.GraphQLInt },
        start_date_time_intervention: { type: graphql.GraphQLString },
        end_date_time_intervention: { type: graphql.GraphQLString },
        buildings: {
            type: Building,
            sqlJoin: (factinterventionTable, buildingsTable, args) => `${factinterventionTable}.building_id = ${buildingsTable}.id`
        }
        })
    });

    //specified the name of the table as well as the unique id of the rows inside the type's configuration object, _typeConfig. 
    //that way, Join Monster will know how to construct a proper SQL statement for your table.
    Intervention._typeConfig = {
        sqlTable: 'factintervention', // the SQL table for this object type is called "factintervention"
        uniqueKey: 'building_id', // id is different for every row
    }

    const Building = new graphql.GraphQLObjectType({
        name: 'Building',
        fields: () => ({
          id: { type: graphql.GraphQLInt },
          address: {
            type: Address,
            sqlJoin: (buildingsTable, addressesTable, args) => `${buildingsTable}.id = ${addressesTable}.entity_id`
          },
          customer: {
            type: Customer,
            sqlJoin: (buildingsTable, customersTable, args) => `${buildingsTable}.id = ${customersTable}.building_id`
          },
          building_detail: {
              type: Building_detail,
              sqlJoin: (buildingsTable, building_detailsTable, args) => `${buildingsTable}.id = ${building_detailsTable}.building_id`
          }
        })
      });
    
        //specified the name of the table as well as the unique id of the rows inside the type's configuration object, _typeConfig. 
        //that way, Join Monster will know how to construct a proper SQL statement for your table.
        Building._typeConfig = {
            sqlTable: 'building',
            uniqueKey: 'id',
        }

        const Address = new graphql.GraphQLObjectType({
            name: 'Address',
            fields: () => ({
              entity_id: { type: graphql.GraphQLInt },
              street_number: { type: graphql.GraphQLString },
              street_name: { type: graphql.GraphQLString },
              suite_or_apartment: { type: graphql.GraphQLString },
              city: { type: graphql.GraphQLString },
              postal_code: { type: graphql.GraphQLString },
              country: { type: graphql.GraphQLString },    
            //   building: {
            //     type: Building,
            //     sqlJoin: (addressesTable, buildingsTable, args) => `${addressesTable}.entity_id = ${buildingsTable}.id`
            //   }
            })
          });
        
            //specified the name of the table as well as the unique id of the rows inside the type's configuration object, _typeConfig. 
            //that way, Join Monster will know how to construct a proper SQL statement for your table.
            Address._typeConfig = {
                sqlTable: 'addresses',
                uniqueKey: 'entity_id',
            }

            const Customer = new graphql.GraphQLObjectType({
                name: 'Customer',
                fields: () => ({
                  id: { type: graphql.GraphQLInt },
                  building_id: { type: graphql.GraphQLInt },
                  company_name: { type: graphql.GraphQLString },
                  company_contact_full_name: { type: graphql.GraphQLString },
                 })
            });
            //specified the name of the table as well as the unique id of the rows inside the type's configuration object, _typeConfig. 
            //that way, Join Monster will know how to construct a proper SQL statement for your table.
            Customer._typeConfig = {
                sqlTable: 'customers',
                uniqueKey: 'buiolding_id',
            }

            const Building_detail = new graphql.GraphQLObjectType({
                name: 'Building_detail',
                fields: () => ({
                  building_id: { type: graphql.GraphQLInt },
                  information_key: { type: graphql.GraphQLString },
                  value: { type: graphql.GraphQLString },
                 })
            });
            //specified the name of the table as well as the unique id of the rows inside the type's configuration object, _typeConfig. 
            //that way, Join Monster will know how to construct a proper SQL statement for your table.
            Building_detail._typeConfig = {
                sqlTable: 'building_details',
                uniqueKey: 'building_id',
            }

            const Employee = new graphql.GraphQLObjectType({
                name: 'Employee',
                fields: () => ({
                    id: { type: graphql.GraphQLInt },
                    firstname: { type: graphql.GraphQLString },
                    lastname: { type: graphql.GraphQLString },
                    intervention: {
                        type: Intervention,
                        sqlJoin: (employeesTable, factinterventionTable, args) => `${employeesTable}.id = ${factinterventionTable}.employee_id`
                    }
                 })
            });
            //specified the name of the table as well as the unique id of the rows inside the type's configuration object, _typeConfig. 
            //that way, Join Monster will know how to construct a proper SQL statement for your table.
            Employee._typeConfig = {
                sqlTable: 'employees',
                uniqueKey: 'id',
            }



                  
const schema = new graphql.GraphQLSchema({ 
    query: QueryRoot 
});

// Create an express server and a GraphQL endpoint
var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: global,
    graphiql: true
}));

app.listen(4000, () => console.log('Express graphQL server now running on localhost:4000/graphql'));