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

    function SearchIndex (options) {
        if ( ! (this instanceof  SearchIndex) ) return new SearchIndex(options);
        options = options || {};
        this.fields = options.fields;
        this.ref = options.ref || 'id';
        this.query_flags = options.query_flags || 'i';
        this.clean_term = options.clean_term || null;
        this.documents = [];
    }

    SearchIndex.prototype = {
        constructor : SearchIndex,
        set         : function (docs) {
            this.documents = docs;
            return this;
        },
        add         : function () {
            this.documents = this.documents.concat.apply(this.documents, arguments);
            return this;
        },
        search      : function (term, as_docs) {
            var results = [],
                fields = this.fields,
                d = 0,
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
                        results.push(as_docs ? doc : doc[this.ref]);
                        break;
                    }
                }
            }
            return results;
        }
    };

    uijet.use({
        search  : {
            Index   : SearchIndex
        }
    })

    .use({
        index       : function (options) {
            this.search_index = new uijet.search.Index(options || this.options.search);
            return this;
        },
        search      : function () {
            return this.search_index.search.apply(this.search_index, arguments);
        },
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
