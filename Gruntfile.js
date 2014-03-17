module.exports = function (grunt) {

    grunt.initConfig({
        pkg   : grunt.file.readJSON('package.json'),
        jsdoc : {
            dist: {
                src    : [
                    'src/uijet.js',
                    'src/widgets/'
                ],
                jsdoc: 'node_modules/.bin/jsdoc',
                options: {
                    configure  : './conf.json',
                    destination: 'docs'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsdoc');


    grunt.registerTask('docs', ['jsdoc:dist']);
};
