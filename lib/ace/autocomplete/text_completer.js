/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2012, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {
    var Range = require("../range").Range;
    var load = require("../../../erlhickey/utils").load;
    var splitRegex = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/;

    function getWordIndex(doc, pos) {
        var textBefore = doc.getTextRange(Range.fromPoints({row: 0, column:0}, pos));
        return textBefore.split(splitRegex).length - 1;
    }

    /**
     * Does a distance analysis of the word `prefix` at position `pos` in `doc`.
     * @return Map
     */
    function wordDistance(doc, pos) {
        var prefixPos = getWordIndex(doc, pos);
        var words = doc.getValue().split(splitRegex);
        var wordScores = Object.create(null);
        
        var currentWord = words[prefixPos];

        words.forEach(function(word, idx) {
            if (!word || word === currentWord) return;

            var distance = Math.abs(prefixPos - idx);
            var score = words.length - distance;
            if (wordScores[word]) {
                wordScores[word] = Math.max(score, wordScores[word]);
            } else {
                wordScores[word] = score;
            }
        });
        return wordScores;
    }

    exports.getCompletions = function(editor, session, pos, prefix, callback) {
        var wordScore = wordDistance(session, pos, prefix);
        var wordList = Object.keys(wordScore);

        if(/erlang/.test(session.getMode().$id)) {
            getErlCompletion(prefix, wordList, wordScore, pos, editor, callback)
        }
        else callback(null, wordList.map(function(word) {
            return {
                caption: word,
                value: word,
                score: wordScore[word],
                meta: "local"
            };
        }));
    };

    //==================================================================
    //=========================== ErlHickey ============================
    //==================================================================
    function getErlCompletion(word, wordList, wordScore, pos, editor, callback){
        var context = editor.session.getDocument().getLine(pos.row).slice(0,pos.column).split(/( |\(|\))/);
        var lastWord = context[context.length-1];

        //Last word is module or definition
        if(/^\w+(\.|:)\w*/.test(lastWord)){
            word = lastWord
        }
        load(word ? "/erl/complete?word="+word: "/erl/complete", function(res){
            var words = JSON.parse(res.response)["result"];
            var localWords = wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    score: wordScore[word],
                    meta: "local"
                };
            });
            var globalWords = words.map(function(word) {
                var cleanWords = word.split("/")[0].split(/(\.|:)/);
                return {
                    caption: word,
                    value: cleanWords[cleanWords.length-1] || word,
                    score: 1000000,
                    meta: "global"
                }
            });
            callback(null, localWords.concat(globalWords))
        }, function(){  //ON ERROR
            var localWords = wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    score: wordScore[word],
                    meta: "local"
                };
            });
            callback(localWords)
        })

    }


    //==================================================================
    //===========================/ErlHickey  ============================
    //==================================================================
});
