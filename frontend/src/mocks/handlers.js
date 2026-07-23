import{http, HttpResponse} from 'msw';
export const handlers=[
    http.get('http://localhost:5000/api/products', ()=>{
        return HttpResponse.json([
            {id:1, name:'Product Alpha', price: 800, category:'General', stock:10},
            {id:2, name:'Product Beta', price: 900, category:'General', stock:15}
        ], {status:200});
    }),
    
    http.post('http://localhost:5000/api/signup', async({request})=>{
        const{email, password}= await request.json();

        if(password.length<6){
            return HttpResponse.json({error:'Password must be at least 6 characters long'}, {status: 400});
        }
        if(email==='existing@example.com'){
            return HttpResponse.json({error:'An account with this email already exists'}, {status:400});
        }
        return HttpResponse.json({success:true, message:'User registered successfully'},{status:200});
    }),

    http.post('http://localhost:5000/api/login', async({request})=>{
        const {email}=await request.json();
        if(email==='wrong@user.com'){
            return HttpResponse.json({error:'Invalid email or password combination.'}, {status:401});
        }
        return HttpResponse.json({token:'mock-jwt-token-xyz', role:'ADMIN'}, {status:200})
    }),

    http.post('http://localhost:5000/api/cart', async({request})=>{
        const{productId}=await request.json();
        const products=['101'];
        return HttpResponse.json(
            {success: true, message:'Item added to cart successfully'},
            {status:200}
        )
    }),

    http.post('http://localhost:5000/api/admin/products', async({request})=>{
        const authHeader=request.headers.get('Authorization');

        if(authHeader==='Bearer standard-user-token'){
            return HttpResponse.json({error:'Product image file asset is missing'}, {status:201});
        }
        return HttpResponse.json({success: true, message:'Product created'},{status:201})
    }),

    http.put('http://localhost:5000/api/admin/products/:id', async({request})=>{
        const authHeader=request.headers.get('Authorization');

        if(authHeader==='Bearer standard-user-token'){
            return HttpResponse.json({error:'Access denied: Administration priveleges required.'}, {status:403});
        }

        const {name}=await request.json();
        if(!name){
            return HttpResponse.json({error:'Product name cannot be blank'}, {status:400});
        }
        
        return HttpResponse.json({success:true, message:'Product updated successfully'}, {status:200});
    }),

    http.delete('http://localhost:5000/api/admin/products/:id', ({request})=>{
        const authHeader=request.headers.get('Authorization');

        if(authHeader==='Bearer standard-user-token'){
            return HttpResponse.json({error: 'Action Forbidden: Unauthorized deletion attempt'}, {status:403});
        }

        return HttpResponse.json({success:true, message:'Product deleted from database'}, {status:200})
    })
]