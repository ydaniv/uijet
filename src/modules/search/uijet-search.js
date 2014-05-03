(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([
            'uijet_dir/uijet',
            'uijet_dir/widgets/Base'
        ], function (uijet) {
            return factory(uijet);
        });
    } else {
        factory(root.uijet);
    }
}(this, function (uijet) {

    /**
     * Constructor for the search index class.
     * 
     * #### Available options:
     * 
     * * `fields` {@type Object}: a map of field names of the documents to search against.
     * Currently values are ignored.
     * * `ref` {@type string}: a field in the searched documents to use as reference for results.
     * Defaults to `null` which uses the doc itself as ref, instead of a value of its field.
     * * `query_flags` {@type string}: `RegExp`'s flags to use when performing search. Defaults to `'i'`.
     * {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions|See "Advanced Searching With Flags"}
     * * `clean_term` {@type function}: method for cleaning the raw input term before searching.
     * 
     * @param {Object} [options] - instance configuration object.
     * @returns {SearchIndex}
     * @constructor
     * @class SearchIndex
     */
    function SearchIndex (options) {
        if ( ! (this instanceof SearchIndex) ) return new SearchIndex(options);
        options = options || {};
        this.fields = options.fields;
        this.ref = options.ref || null;
        this.query_flags = options.query_flags || 'i';
        this.clean_term = options.clean_term || null;
        this.documents = [];
    }

    SearchIndex.prototype = /** @lends SearchIndex.prototype */ {
        constructor : SearchIndex,
        /**
         * Sets documents to populate the index.
         * 
         * @method SearchIndex#set
         * @param {Array} docs - documents to search in.
         * @returns {SearchIndex}
         */
        set         : function (docs) {
            this.documents = docs;
            return this;
        },
        /**
         * Adds more documents to the index to search in.
         * 
         * @method SearchIndex#add
         * @param {Array} docs - documents to add to the index.
         * @returns {SearchIndex}
         */
        add         : function (docs) {
            this.documents.push.apply(this.documents, docs);
            return this;
        },
        /**
         * Performs search using given `term` and returns list of results.
         * 
         * @method SearchIndex#search
         * @param {string} term - the search term to use for searching the documents.
         * @param {string|null} [ref] - override the `ref` option just for this search.
         * @returns {Array} - results list. Can be a list of documents or values specified by `ref` option.
         */
        search      : function (term, ref) {
            var results = [],
                fields = this.fields,
                d = 0,
                _ref = arguments.length > 1 ? ref : this.ref,
                re, doc, field;
            if ( this.clean_term ) {
                term = this.clean_term(term);
            } 
            try {
                re = new RegExp(term, this.query_flags);
            } catch (e) {
                re = new RegExp(void 0, this.query_flags);
            }
            for ( ; doc = this.documents[d]; d++ ) {
                for ( field in fields ) {
                    if ( field in doc && re.test(doc[field]) ) {
                        results.push(_ref ? doc[_ref] : doc);
                        break;
                    }
                }
            }
            return results;
        }
    };

    /**
     * uijet-search search module.
     * 
     * @module search/uijet-search
     * @extends uijet
     */
    uijet.use({
        /**
         * @namespace search
         * @memberOf module:search/uijet-search
         */
        search  : {
            /**
             * @constructor
             * @memberOf module:search/uijet-search.search
             */
            Index   : SearchIndex
        }
    })

    .use(
    /**
     * Mixin that adds searching logic to widgets.
     * 
     * @class module:search/uijet-search.Searched
     * @extends uijet.BaseWidget
     */
    {
        /**
         * Constructs and initializes a search index.
         * 
         * #### Related options:
         * 
         * * `search` {@type Object}: {@link SearchIndex} instance configuration object.
         * 
         * @method module:search/uijet-search.Searched#index
         * @param {Object} [options] - {@link SearchIndex} instance configuration object.
         * Defaults to `search` config option.
         * @returns {Widget} this
         */
        index       : function (options) {
            this.search_index = new uijet.search.Index(options || this.options.search);
            return this;
        },
        /**
         * Performs search using given `term` and returns list of results.
         * 
         * @method module:search/uijet-search.Searched#search
         * @param {string} term - the search term to use for searching the documents.
         * @param {string|null} [ref] - override the `ref` option just for this search.
         * @returns {Array} - results list. Can be a list of documents or values specified by `ref` option.
         */
        search      : function (term, ref) {
            return this.search_index.search.apply(this.search_index, arguments);
        },
        /**
         * Highlights results in given `text` by mathcing against `term`.
         * 
         * @method module:search/uijet-search.Searched#highlight
         * @param {string} text - the text to search in.
         * @param {string} term - the term to find and highlight.
         * @returns {string} - the highlighted text.
         */
        highlight   : function (text, term) {
            var re;
            try {
                re = new RegExp(term, this.search_index.query_flags);
            } catch (e) {
                re = new RegExp(void 0, this.search_index.query_flags);
            }
            // '$&' is a placeholder for the matched search term
            return text.replace(re, '<em>$&</em>');
        }
    }, uijet.BaseWidget.prototype);

}));
