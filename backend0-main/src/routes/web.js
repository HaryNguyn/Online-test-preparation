const express = require('express');
const { getHomepage, getABC, getDangNhap, postCreateUser, getCreatePage, getUpdatePage, postUpdateUser, postDeleteUser, postHandleRemoveUser } = require('../controllers/homeController');
const router = express.Router();

router.get('/', getHomepage);
router.get('/abc', getABC);
router.get('/harri', getDangNhap);

router.get('/create', getCreatePage);
router.get('/update/:id', getUpdatePage);

router.post('/create-users', postCreateUser);
router.post('/update-users', postUpdateUser);

router.post('/delete-user/:id', postDeleteUser);
router.post('/delete-user', postHandleRemoveUser);

module.exports = router;