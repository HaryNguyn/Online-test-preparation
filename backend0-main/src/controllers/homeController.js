const connection = require('../config/database');
const { getALLUsers, getUserById, getUpdateUserById, deleteUserById } = require('../services/CURDService');

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

const postCreateUser = async (req, res) =>{
    
    let email = req.body.email;
    let name = req.body.myname;
    let city = req.body.city;

    console.log(">>> email: ", email,'name : ', name,'city: ', city)

    let [results, fields] = await connection.query(`INSERT INTO Users (email, name, city) VALUES(?, ?, ?) `,[email, name, city],

    );

    console.log(">>> check results", results);

    res.send("Create user success");

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

    let email = req.body.email;
    let name = req.body.myname;
    let city = req.body.city;
    let userId = req.body.userId;

    await getUpdateUserById(email,name,city,userId);

    res.send("Update user success");

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