const {PrismaClient}=require('@prisma/client');
const bcrypt= require('bcrypt');
const prisma= new PrismaClient();

const SALT_ROUNDS= 10;

async function main(){
    console.log('Starting database seeding sequence...');

    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.couponRedemption.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.notification.deleteMany({});
    console.log('Existing user tables cleared');

    const hashedAdminPassword= await bcrypt.hash(process.env.ADMIN_PASSWORD, SALT_ROUNDS);
    const hashedUserPassword= await bcrypt.hash(process.env.TEST_USER_PASSWORD, SALT_ROUNDS)

    const coupons=await prisma.coupon.createMany({
        data:[
            {code:'A161220080', discountPercent: 10, expiresAt: new Date('2027-08-04'), stock:30},
            {code:'B261220080', discountPercent: 20, expiresAt: new Date('2027-08-04'), stock:25},
            {code:'C361220080', discountPercent: 30, expiresAt: new Date('2027-08-04'), stock:20},
            {code:'D461220080', discountPercent: 40, expiresAt: new Date('2027-08-04'), stock:15},
            {code:'E561220080', discountPercent: 50, expiresAt: new Date('2027-08-04'), stock:10}
        ]
    })
    console.log('Coupons seeded')
    const user1=await prisma.user.create({
        data:{
            email:process.env.ADMIN_EMAIL,
            password:hashedAdminPassword,
            name: 'Admin Tester',
            age: 17,
            gender: 'FEMALE',
            role: 'ADMIN'
        },
    });

    const user2 = await prisma.user.create({
        data:{
            email:process.env.TEST_USER_EMAIL,
            password:hashedUserPassword,
            name: 'Tester_name',
            age: 16,
            gender: 'FEMALE',
            role: 'USER'
        },
    });

    console.log('Database successfully seeded. Created users:')
    console.log(` - ${user1.email} (${user1.name})`);
    console.log(`  - ${user2.email} (${user2.name})`)

    await prisma.product.deleteMany({});
    console.log('Existing product tables cleared');

    const products=await prisma.product.createMany({
        data: [
            {name: 'Black Iphone 17', description:'High Quality', price: 800, discount:0, stock:15, category:'Iphones', image:'/assets/products/blackIphone17.jpg'},
            {name: 'Blue Iphone 17', description:'High Quality', price: 800, discount:0, stock:15, category:'Iphones', image:'/assets/products/blueIphone17.jpg'},
            {name: 'Green Iphone 17', description:'High Quality', price: 800, discount:0, stock:15, category:'Iphones', image:'/assets/products/greenIphone17.jpg'},
            {name: 'Lavender Iphone 17', description:'High Quality', price: 800, discount:0, stock:15, category:'Iphones', image:'/assets/products/lavenderIphone17.jpg'},
            {name: 'White Iphone 17', description:'High Quality', price: 800, discount:0, stock:15, category:'Iphones', image:'/assets/products/whiteIphone17.jpg'},
            {name: 'Black Samsung S26', description:'High Quality', price: 900, discount:0, stock:15, category:'Samsung', image:'/assets/products/blackSamsungS26.jpg'},
            {name: 'Blue Samsung S26', description:'High Quality', price: 900, discount:0, stock:15, category:'Samsung', image:'/assets/products/blueSamsungS26.jpg'},
            {name: 'White Samsung S26', description:'High Quality', price: 900, discount:0, stock:15, category:'Samsung', image:'/assets/products/whiteSamsungS26.jpg'},
            {name: 'Violet Samsung S26', description:'High Quality', price: 900, discount:0, stock:15, category:'Samsung', image:'/assets/products/violetSamsungS26.webp'},
            {name: 'Dell 14 Plus', description:'High Quality', price: 900, discount:0, stock:15, category:'Laptop', image:'/assets/products/dell14plus.jpg'},
            {name: 'Hp Omnibook X', description:'High Quality', price: 1000, discount:0, stock:15, category:'Laptop', image:'/assets/products/hpOmnibookX.jpg'},
            {name: 'Lenovo ThinkPad X1', description:'High Quality', price: 1100, discount:0, stock:15, category:'Laptop', image:'/assets/products/lenovoThinkpadX1.png'},
            /*The other pics are for the admins to add*/
        ]
    });

    console.log(`Database successfully seeded with ${products.count} products.`)
}

main()
    .catch((error)=>{
        console.error(`Critical error encountered during database seed:`, error);
        process.exit(1);
    })
    .finally(async()=>{
        await prisma.$disconnect();
        console.log('Prisma database client connection closed safely')
    })