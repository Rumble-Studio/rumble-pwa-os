export LIBNAME=;
nx g @nrwl/angular:lib ${LIBNAME}s-layout;
nx g @nrwl/angular:component pages/${LIBNAME}-list --project=${LIBNAME}s-layout
nx g @nrwl/angular:component pages/${LIBNAME}-editor --project=${LIBNAME}s-layout
nx g @nrwl/angular:component pages/${LIBNAME}s-layout --project=${LIBNAME}s-layout
