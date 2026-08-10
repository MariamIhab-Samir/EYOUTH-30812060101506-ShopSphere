const{PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();

async function releaseExpiredReservations() {
    const cutoff = new Date(Date.now() - 20 * 60 * 1000);
    const expired =await prisma.cartItem.findMany({
        where: {
            reservedAt: {
                lt: cutoff
            }
        }
    });

    for (const item of expired) {
        await prisma.$transaction([ 
            prisma.product.update({where: {id: item.productId}, data: {stock: {increment: item.quantity}}}),
            prisma.cartItem.delete({where: {id: item.id}})
        ]);
    }

    return expired.length;
}
module.exports = releaseExpiredReservations;