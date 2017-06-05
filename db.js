let Sequelize = require("sequelize");

let sequelize = new Sequelize(undefined, undefined, undefined,{
	dialect:"sqlite",
	storage: "./data/database.sqlite"
});

module.exports = {
	Todo: sequelize.import("./models/todo.js"),
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