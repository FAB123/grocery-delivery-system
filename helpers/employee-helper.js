var db = require('../config/connection');
var collection = require('../config/collection');
var bcrypt=require('bcrypt');
const { response } = require('express');

module.exports={
    clearDb:()=>{
        return new Promise(async(resolve, reject)=>{
            pwd = await bcrypt.hash('123',10);
            userData={username:'admin', password:pwd, firstname:'Fysal', lastname:'KT', mobile:'530829178'};
            db.get().collection(collection.EMPLOYEE_COLLECTION).insertOne(userData).then((data)=>{
               resolve(data.ops[0])
            })
        })
    },
    createEmployee:(employeeData)=>{
        
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={};
            let employee=await db.get().collection(collection.EMPLOYEE_COLLECTION).findOne({mobile:userData.mobile})
            if(employee)
            {
                bcrypt.compare(userData.password,employee.password).then((status)=>{
                    if(status){
                    response.status=true;
                    response.employee=employee;
                    resolve(response)
                    }
                    else{
                        response.status=false;
                        response.message="invalid Password"
                        resolve(response)
                    }
                    
                })
            }
            else{
                response.status=false;
                response.message="invalid Mobile Number";
                resolve(response)
            }
        })
    }
}