let crypto = require("crypto-js");
let easyPbkdf2 = require("easy-pbkdf2")();
let jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes)=>{
	let User = sequelize.define("user",{
		email:{
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: { isEmail:true }
		},

		pass_hash: DataTypes.STRING,
		salt: DataTypes.STRING,

		password:{
			type: DataTypes.VIRTUAL,
			allowNull: false,
			set: function(password){
				let salt = easyPbkdf2.generateSalt();
				let hash = crypto.SHA256(password+""+salt);

				this.setDataValue("password",password);
				this.setDataValue("pass_hash",hash.toString());
				this.setDataValue("salt",salt);
			},
			validate: { len: [5,100] }
		}
	},{
		hooks: {
			beforeValidate: (user, options) => {
				user.email = typeof user.email === "string" ? user.email.toLowerCase() : user.email;
			}
		}//,
		// instanceMethods: {
		// 	toPublicJSON: function() {
		// 		let user = this.toJSON();
		// 		return (delete user.salt, delete user.pass_hash, delete user.password, user);
		// 	}
		// }
	});

	//works in sequelise v4
	// User.prototype.authenticate = function(msg) {console.log(`User.authenticated = ${msg}`);};
	// 'this' in arrow function points to undefined

	User.prototype.genToken = function(type) {
		let data = JSON.stringify({
			id: this.get("id"),
			type	
		});
		let encData = crypto.AES.encrypt(data,"aBgCsth123k45!@#");
		let token = jwt.sign( { payload: encData.toString()	}, "secret" );

		return token;
	};

	User.prototype.toPublicJSON = function() {
		let user = this.toJSON();
		return (delete user.salt, delete user.pass_hash, delete user.password, user);
	};

	User.getByToken = function(token){
		let decData = crypto.AES.decrypt(token.payload, "aBgCsth123k45!@#").toString(crypto.enc.Utf8);
		let data = JSON.parse(decData);
		return User.findById(data.id);
	};


	return User;
};
