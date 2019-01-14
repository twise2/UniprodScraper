var cheerio = require('cheerio');
var requestPromise = require('request-promise');
var fs = require("fs");


var uniprots = fs.readFileSync('./uniprotIds.txt').toString().split(/\r\n|\n/);

var url = 'https://www.uniprot.org/uniprot/'
var lengths = []
var weights = []
var validUniprots = []

requests = []
uniprots.forEach(function(uniprot_id){
    requests.push(
        requestPromise(url+uniprot_id, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                validUniprots.push(uniprot_id)
                //if lengths and weights not found
                if($('span.sequence-field-header.tooltiped').length < 2){
                    lengths.push('**Not FOUND**')
                    weights.push('**Not FOUND**')
                }
                $('span.sequence-field-header.tooltiped').each(function(i, element){
                    if (i == 0){
                    lengths.push($(this).next().text());
                }
                else if (i == 1){
                    weights.push($(this).next().text());
                }
                })
            }
        })
    )
})

Promise.all(requests).then(function(){
    //create dictionary of uniprot, length, weights
    dictionary = {}
    validUniprots.forEach(function(id,i){
        json = {
            _length: lengths[i],
            _weight: weights[i]
        };
        dictionary[id] = json;
    });

    //write tab seperate uniprot id, length, weight
    var file = fs.createWriteStream('array.txt');
    file.on('error', function(err) { console.log('issue writing to file') });
    uniprots.forEach(function(id){
        file.write(id + '\t' + dictionary[id]._length + '\t' + dictionary[id]._weight + '\n');
    });
    file.end();


    console.log('numbers below should be equal, otherwise error')
    console.log(validUniprots.length)
    console.log(lengths.length)
    console.log(weights.length)
    console.log('complete')
})
