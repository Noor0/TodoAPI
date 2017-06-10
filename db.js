let Sequelize = require("sequelize");


let sequelize;
if(process.env.NODE_ENV === "production")	
	sequelize = new Sequelize(process.env.DATABASE_URL,{
		dialect:"postgresql"
	});
else
	sequelize = new Sequelize(undefined, undefined, undefined,{
		dialect:"sqlite",
		storage: "./data/database.sqlite"
	});

let Todo = sequelize.import("./models/todo.js");
let User = sequelize.import("./models/user.js");
let Token = sequelize.import("./models/token.js");

// DEFINING ASSOCIATIONS
User.hasMany(Todo);
User.hasMany(Token);

module.exports = {
	Todo,
	User,
	Token,
	Sequelize,
	sequelize
};

// let Todo = sequelize.define("todo",{
// 	description:{
// 		type: Sequelize.STRING,
// 		allowNull: false,
// 		validate:{
// 			len: [1,60]
// 		}
// 	},
// 	status:{
// 		type: Sequelize.BOOLEAN,
// 		allowNull: false,
// 		defaultValue: false
// 	}
// });

// sequelize.sync({force:true})
// 	.then(()=>{
// 		Todo.create({
// 			description:"i play games",
// 			status: false
// 		});
// 		return Todo.create({
// 			description:"i don't play game",
// 		});
// 	}).then(()=>{
// 		return Todo.create({
// 			description:"whatsapp is my favorite",
// 		});
// 	}).then(()=>{
// 		return Todo.findAll({
// 			where:{
// 				description:{
// 					$like: "%games%"
// 				}
// 			}
// 		});
// 	}).then( toto => {
// 		toto.forEach( todo => console.log(todo.toJSON()) );
// 	});