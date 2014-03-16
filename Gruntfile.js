module.exports = function (grunt) {

    grunt.initConfig({
        pkg  : grunt.file.readJSON('package.json'),
        jsdoc: {
            docs: {
                src    : ['src/*.js'],
                options: {
                    destination: 'doc',
                    configure: './conf.json'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsdoc');


    grunt.registerTask('docs', ['jsdoc:docs']);
};
