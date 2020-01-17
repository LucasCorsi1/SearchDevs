const Dev = require('../models/Dev');

const axios = require('axios');

const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');




module.exports = {

    async index(request, response) {
        const devs = await Dev.find();

        return response.json(devs);
    },


    async store(request, response) {

        const {
            github_username,
            techs,
            latitude,
            longitude
        } = request.body;
        const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

        let dev = await Dev.findOne({
            github_username
        });

        if (!dev) {

            const {
                name = login, avatar_url, bio
            } = apiResponse.data;

            const techsArray = parseStringAsArray(techs);

            const location = {
                type: 'Point',
                coordinates: [longitude, latitude],
            };

            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            });

            ///filtrar as conexões há no maximo 10km de distancia ,
            /// onde o dev deve ter pelo menos uma das tecnologias pesquisadas

            const sendSocketMessageTo = findConnections(
                { latitude, longitude },
                techsArray,
            )

            sendMessage(sendSocketMessageTo, 'new-dev', dev);
        }
        return response.json(dev);
    },

    async update(request, response) {

        const _id = request.query;

        const {
            techs,
            latitude,
            longitude
        } = request.body;

        let dev = await Dev.findOne({
            _id
        });


        if (dev) {
            const apiResponse = await axios.get(`https://api.github.com/users/${dev.github_username}`);

            const {
                name = login, avatar_url, bio
            } = apiResponse.data;

            const techsArray = parseStringAsArray(techs);

            const location = {
                type: 'Point',
                coordinates: [longitude, latitude],
            };

            dev = await Dev.updateOne({
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            });
        }

        return response.json(dev);
    },

    async destroy(request, response) {

        const _id = request.query;
        let dev = await Dev.findOne({ _id });
        if (dev) {

            dev = await Dev.destroy;
            return response.json({
                message: "Deletado"
            });
        } else {
            return response.json({
                message: "Não encontrado"
            });
        }

    },
};