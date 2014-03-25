module.exports = function (grunt) {

    grunt.initConfig({
        pkg   : grunt.file.readJSON('package.json'),
        clean : {
            docs: ['docs']
        },
        jsdoc : {
            dist: {
                src    : [
                    'src/uijet.js',
                    'src/widgets/',
                    'src/mixins/',
                    'src/modules/'
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
    grunt.loadNpmTasks('grunt-contrib-clean');


    grunt.registerTask('docs', ['clean:docs', 'jsdoc:dist']);
};
