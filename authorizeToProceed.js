let crypto = require("crypto-js");

module.exports = (User, Token) => {
	return (req,res,next) => {
		if( req.user !== undefined ){
			let token = req.headers.authorization.split(" ")[1];
			let tokenHash = crypto.MD5(token).toString();
			Token.find({
				where:{
					token_hash:{
						$eq: tokenHash
					}
				}
			}).then( tokenRow => {
				if(tokenRow == null)
					throw new Error("please login");
				else
					User.findById(tokenRow.get("userId")).then( user => {
						if(user !== null){
							req.user = user.toPublicJSON();
							next();
						}
						else
							throw new Error("User doesn't exist");
					}, () => res.status(401).send());
			}).catch(() => res.status(401).end());
		}
		else
			res.status(401).send("please login");
	};
};


// module.exports = User => {
// 	return (req,res,next) => {
// 		if( req.user !== undefined ){
// 		User.getByToken(req.user).then( user => {
// 			if(user !== null){
// 				req.user = user.toPublicJSON();
// 				next();
// 			}
// 			else
// 				throw new Error("User doesn't exist");
// 		}, (err) => res.send(err));
// 	}
// 	else
// 		res.status(401).send("login first!");
// 	};
// };