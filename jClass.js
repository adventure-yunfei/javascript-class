/**
 * Created by yunfei on 9/8/15.
 */
(function () {
    var P_SUPER = '$super',
        P_CONSTRUCTOR = '$constructor',
        P_SUPER_FNS_MAP = '_superFns',
        P_IS_WRAPPER_FOR_ANY = '_isWrapperForAny',
        P_SUPER_ID_SEARCH_CHAIN = '_idChain',
        P_IDENTIFIER = '_id',
        V_INDENTIFIER_ANY = '*';

    var idCount = 0;
    function getUniqueIdentifier() {
        return 'jClass_id_' + (idCount++);
    }

    function wrapForIdentifierAny(fn) {
        var wrapperFn = function () {
            fn.apply(this, arguments);
        };
        wrapperFn[P_IS_WRAPPER_FOR_ANY] = true;
        return wrapperFn;
    }

    function findSuper(fn, idSearchChain) {
        var superFnsMap = fn[P_SUPER_FNS_MAP];
        if (superFnsMap) {
            for (var i = 0; i < idSearchChain.length; i++) {
                var superFn = superFnsMap[idSearchChain[i]];
                if (superFn) {
                    return superFn;
                }
            }
        }
    }

    function callSuper() {
        var fnCallingSuper = callSuper.caller,
            srcFn = fnCallingSuper.caller && fnCallingSuper.caller[P_IS_WRAPPER_FOR_ANY] ? fnCallingSuper.caller : fnCallingSuper,
            superFn = findSuper(srcFn, this[P_SUPER_ID_SEARCH_CHAIN] || [V_INDENTIFIER_ANY]/**For no-class object*/);
        return superFn && superFn.apply(this, arguments);
    }

    function mixin(target, mixins) {
        if (!target[P_SUPER]) {
            target[P_SUPER] = callSuper;
        }
        var identifier = target.hasOwnProperty(P_IDENTIFIER) ? target[P_IDENTIFIER] : V_INDENTIFIER_ANY;
        for (var i = 0; i < mixins.length; i++) {
            var src = mixins[i];
            for (var key in src) {
                var val = src[key];
                if (val instanceof Function && target[key] instanceof Function) {
                    if (identifier === V_INDENTIFIER_ANY || findSuper(val, target[P_SUPER_ID_SEARCH_CHAIN] || [V_INDENTIFIER_ANY])) {
                        val = wrapForIdentifierAny(val);
                    }
                    var superFnsMap = val[P_SUPER_FNS_MAP] = val[P_SUPER_FNS_MAP] || {};
                    superFnsMap[identifier] = target[key];
                }
                target[key] = val;
            }
        }
        return target;
    }

    var jClass = {
        declare: function declare(SuperClass, mixins, classProps) {
            var id = getUniqueIdentifier(),
                superProto = SuperClass && SuperClass.prototype,
                proto = superProto ? Object.create(superProto) : {};
            proto[P_IDENTIFIER] = id;
            proto[P_SUPER_ID_SEARCH_CHAIN] = [V_INDENTIFIER_ANY, id].concat(superProto ? superProto[P_SUPER_ID_SEARCH_CHAIN].slice(1) : []);
            mixin(proto, (mixins || []).concat(classProps ? [classProps] : []));
            function Constructor() {
                this[P_CONSTRUCTOR] && this[P_CONSTRUCTOR].apply(this, arguments);
            }
            Constructor.prototype = proto;
            proto._Class = Constructor;
            return Constructor;
        },
        mixin: mixin
    };
    if (typeof window !== 'undefined') window.jClass = jClass;
    if (typeof module !== 'undefined') {
        module.exports = jClass;
    } else if (typeof define === 'function') {
        define(jClass);
    }
}());
