const connection = require('../config/database');
const { getALLUsers, getUserById, getUpdateUserById, deleteUserById } = require('../services/CURDService');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const getHomepage = async (req, res) =>{
    let results = await getALLUsers();
    return res.render('Home.ejs' , {ListUsers: results })
   
}

const getABC = (req, res)=>{
    res.send('check ABC')
} 

const getDangNhap = (req, res)=>{
    //res.send('<h1>Hoi lam gi</h1>')
    res.render('sample.ejs')
}

const postCreateUser = async (req, res) => {
    try {
        const email = req.body.email && req.body.email.trim();
        const name = req.body.myname && req.body.myname.trim();
        const password = req.body.password;
        const rawRole = (req.body.role || '').trim().toLowerCase();
        const grade = req.body.grade && req.body.grade.trim() ? req.body.grade.trim() : null;

        if (!email || !name || !password) {
            return res.status(400).send('Email, name và password là bắt buộc');
        }

        // Chuẩn hóa role: chỉ chấp nhận 4 giá trị, còn lại mặc định là 'student'
        const allowedRoles = ['student', 'teacher', 'admin', 'parent'];
        const role = allowedRoles.includes(rawRole) ? rawRole : 'student';

        // Hash mật khẩu giống như authController
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const [results] = await connection.query(
            'INSERT INTO Users (id, email, password, name, role, grade) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, email, hashedPassword, name, role, grade]
        );

        console.log('>>> Created user from Create.ejs form:', results);
        // Sau khi tạo xong thì quay lại trang danh sách
        return res.redirect('/');
    } catch (error) {
        console.error('Error creating user from Create.ejs:', error);
        // Hiển thị message chi tiết để dễ debug khi dev
        return res.status(500).send(`Failed to create user: ${error.message || 'Unknown error'}`);
    }
}

const getCreatePage = (req, res) => {
    res.render('Create.ejs')
}
const getUpdatePage = async (req, res) => {
    const userId = req.params.id;

    let user = await getUserById(userId);
    res.render('edit.ejs', {userEdit : user});
}

const postUpdateUser = async (req, res) => {

    const email = req.body.email;
    const name = req.body.myname;
    const role = req.body.role;
    const grade = req.body.grade;
    const userId = req.body.userId;

    try {
        await getUpdateUserById(email, name, role, grade, userId);
        return res.redirect('/');
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).send('Failed to update user');
    }
}

const postDeleteUser = async (req, res)=>{
    const userId = req.params.id;

    let user = await getUserById(userId);
    res.render('delete.ejs', { userEdit: user });

}

const postHandleRemoveUser = async (req, res) =>{
    const id = req.body.userId;
    await deleteUserById(id);
    res.redirect('/');
}

module.exports = {
    getHomepage, getABC, getDangNhap, postCreateUser, getCreatePage, getUpdatePage, postUpdateUser, postDeleteUser, postHandleRemoveUser
}