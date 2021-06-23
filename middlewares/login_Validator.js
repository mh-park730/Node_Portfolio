const { alert } = require('../lib/common');

/**
* 로그인 유효성 검사
*
*/
module.exports.loginValidator = async (req, res, next) => {
	try {
		if (!req.body.memId) {
			return alert('아이디를 입력하세요.');
		}
	
		if (!req.body.memPw) {
			return alert('비밀번호를 입력하세요.');
		}
		
		// 회원의 존재 유무 체크 
		const sql = "SELECT COUNT(*) as cnt FROM member WHERE memId = ?";
		const rows = await sequelize.query(sql, {
			replacements : [req.body.memId], 
			type : QueryTypes.SELECT,
		});
		
		if (rows[0].cnt == 0) {
			throw new Error('존재하지 않는 회원입니다.');
		}
	} catch (err) {
		next(err);
	}
		next();
};