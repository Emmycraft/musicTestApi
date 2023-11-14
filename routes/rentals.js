const { Rental, validate } = require('../models/rental');
const { Movie } = require('../models/movie');
const { Customer } = require('../models/customer');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async(req, res) => {
    const rentals = await Rental.find().sort('-dateOut');
    res.send(rentals);
});

router.post('/', async(req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Invalid customer.');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Invalid movie.');

    if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock.');


    let rental = new Rental({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        },
        rentalCount: req.body.rentalCount

    });
    // async function transact() {
    //     const session = await mongoose.startSession()
    //     session.startTransaction()
    //     try {
    //         await rental.save({ session });
    //         movie.updateOne({ $inc: { numberInStock: -1 } }, { session })
    //         session.commitTransaction()
    //         session.endSession()
    //         console.log('the number in stock transaction was successful');
    //         movie.save();
    //         res.send(rental);
    //     } catch (err) {
    //         await session.abortTransaction()
    //         session.endSession()
    //         console.log(err.message);
    //     }
    // }
    // transact()
    try {

        //console.log(`rentalCount: ${rental.rentalCount++}`);

        await rental.updateOne({ $inc: { rentalCount: +1 } })
        await rental.save()




        // movie.numberInStock--;
        await movie.updateOne({ $inc: { numberInStock: -1 } })
        await movie.save()

        res.send(rental);
    } catch (err) {
        console.log(err.message);
    }
});

router.get('/:id', async(req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) return res.status(404).send('The rental with the given ID was not found.');

    res.send(rental);
});

module.exports = router