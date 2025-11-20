const { body, param, validationResult } = require('express-validator');

/**
 * 검증 결과 확인 미들웨어
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다.',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * 호스트 회원가입 검증
 */
const validateHostRegister = [
  body('hostId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('호스트 ID는 3-20자 사이여야 합니다.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('호스트 ID는 영문, 숫자, 언더스코어만 사용 가능합니다.'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('비밀번호는 6-100자 사이여야 합니다.'),
  validate,
];

/**
 * 호스트 로그인 검증
 */
const validateHostLogin = [
  body('hostId')
    .trim()
    .notEmpty()
    .withMessage('호스트 ID를 입력해주세요.'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.'),
  validate,
];

/**
 * 모임 생성 검증
 */
const validateMeetingCreate = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('모임 제목은 1-100자 사이여야 합니다.')
    .escape(), // XSS 방지
  body('maxParticipants')
    .isInt({ min: 2, max: 1000 })
    .withMessage('최대 참가자는 2-1000명 사이여야 합니다.'),
  body('hostJoinsAsParticipant')
    .isBoolean()
    .withMessage('호스트 참여 방식은 true 또는 false여야 합니다.'),
  body('hostParticipantName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('호스트 참가자명은 최대 50자입니다.')
    .escape(),
  body('hostPassword')
    .optional()
    .isLength({ min: 4, max: 100 })
    .withMessage('호스트 비밀번호는 4-100자 사이여야 합니다.'),
  body('hostParticipantMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('방명록은 최대 500자입니다.')
    .escape(),
  validate,
];

/**
 * 참가자 추가 검증
 */
const validateParticipantAdd = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('참가자 이름은 1-50자 사이여야 합니다.')
    .escape(),
  body('password')
    .isLength({ min: 4, max: 100 })
    .withMessage('비밀번호는 4-100자 사이여야 합니다.'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('방명록은 최대 500자입니다.')
    .escape(),
  validate,
];

/**
 * 참가자 로그인 검증
 */
const validateParticipantLogin = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('참가자 이름을 입력해주세요.'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.'),
  validate,
];

/**
 * 모임 코드 검증
 */
const validateMeetingCode = [
  param('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('모임 코드는 6자리여야 합니다.')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('모임 코드는 대문자와 숫자만 사용 가능합니다.'),
  validate,
];

/**
 * MongoDB ObjectId 검증
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .trim()
    .matches(/^[a-f\d]{24}$/i)
    .withMessage('유효하지 않은 ID입니다.'),
  validate,
];

/**
 * 방명록 수정 검증
 */
const validateMessageUpdate = [
  body('message')
    .trim()
    .isLength({ max: 500 })
    .withMessage('방명록은 최대 500자입니다.')
    .escape(),
  validate,
];

/**
 * 최대 참가자 수정 검증
 */
const validateMaxParticipants = [
  body('maxParticipants')
    .isInt({ min: 1, max: 1000 })
    .withMessage('최대 참가자는 1-1000명 사이여야 합니다.'),
  validate,
];

module.exports = {
  validate,
  validateHostRegister,
  validateHostLogin,
  validateMeetingCreate,
  validateParticipantAdd,
  validateParticipantLogin,
  validateMeetingCode,
  validateObjectId,
  validateMessageUpdate,
  validateMaxParticipants,
};
