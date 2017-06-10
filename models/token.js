let crypto = require("crypto-js");

module.exports = (sequelize, DataTypes) => {
	return sequelize.define("token",{
		token: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				notEmpty: true
			},
			set: function(value){
				this.setDataValue("token", value);
				let tokenHash = crypto.MD5(value).toString();
				this.setDataValue("token_hash", tokenHash);
			}
		},

		token_hash: DataTypes.STRING

	});
};