const { joinValidator } = require('../middlewares/join_validator');
const { loginValidator } = require('../middlewares/login_validator');
const { findPwValidator, changePwValidator } = require("../middlewares/findpw_validator");
const { memberOnly, guestOnly } = require('../middlewares/member_only');
const member = require("../models/member"); // Member Model
const { alert, go } = require('../lib/common');
const express = require('express');
const router = express.Router();

router.route("/join")
		// 회원 가입 양식
		.get(guestOnly, (req, res, next) => {
			if (req.isLogin) { // 로그인 상태인 경우 접근 불가
				return res.send("<script>history.back();</script>");
			}
			
			res.render('member/form');
		})
		// 회원 가입 처리
		.post(joinValidator, async (req, res, next) => {
			const result = await member.data(req.body, req.session).join();
			try {
				if (result) { // 회원 가입 성공 -> 로그인 페이지
					return res.redirect("member/login");
				}
			} catch (err) {
				return alert("회원 가입에 실패하였습니다.", res);
			}
		});

router.route("/login")
		// 로그인 양식
		.get(guestOnly, (req, res, next) => {
			if (req.isLogin) {
				return res.send("<script>history.back();</script>");
			}
			
			res.render('member/login');
		})
		// 로그인 처리
		.post(loginValidator, async (req, res ,next) => {
			const result = await member.login(req.body.memId, req.body.memPw, req);
			try {
				if (result) {
					res.redirect("/");
				}
			} catch (err) {
				return alert("로그인에 실패하였습니다.", res);
			}
		});

router.get('/logout', (req, res, next) => {
	req.session.destroy();
	return res.redirect("/member/login");
});

/** 아이디 찾기 */
router.route("/find_id")
	/** 찾기 양식 */
	.get(guestOnly, (req, res, next) => {
		
		return res.render("member/find_id");
	})
	/** 찾기 처리 */
	.post(guestOnly, async (req, res, next) => {
		try {
			const memId = await member.findId(req.body.memNm, req.body.cellPhone);
			if (!memId) {
				throw new Error('일치하는 아이디가 없습니다.');
			}
			
			return res.render("member/find_id", { memId });
		} catch (err) {
			return alert(err.message, res, -1);
		}
	});

/** 비밀번호 찾기 */
router.route("/find_pw")
	.get(guestOnly, (req, res, next) => {
		return res.render("member/find_pw");
	})
	.post(guestOnly, findPwValidator, async (req, res, next) => {
		try {
			const memNo = await member.data(req.body).findPw();
			if (!memNo) {
				throw new Error('일치하는 회원이 없습니다.');
			}
			req.session.findPwMemNo = memNo;
			return res.render("member/change_password");
		} catch (err) {
			return alert(err.message, res, -1);
		}
	})
	/** 비밀번호 변경 처리 */
	.patch(guestOnly, changePwValidator, async (req, res, next) => {
		const result = await member.changePw(req.session.findPwMemNo, req.body.memPw);
		if (result) { // 비밀번호 변경 성공 -> 로그인 
			delete req.session.findPwMemNo;
			return go("/member/login", res, "parent");
		}
		
		return alert("비밀번호 변경 실패하였습니다.", res);
	});

module.exports = router;