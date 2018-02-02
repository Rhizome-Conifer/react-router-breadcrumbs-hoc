import { createElement } from 'react';
import { matchPath, withRouter } from 'react-router';

const DEFAULT_MATCH_OPTIONS = { exact: true };

// if user is passing a function (component) as a breadcrumb, make sure we
// pass the match object into it. Else just return the string.
const renderer = ({ breadcrumb, match }) => {
  if (typeof breadcrumb === 'function') {
    return createElement(breadcrumb, { match });
  }
  return breadcrumb;
};

export const getBreadcrumbs = ({ routes, pathname }) => {
  const matches = [];
  const segments = [];

  /* remove trailing slash "/" from pathname unless it's a base route
     (avoids multiple of the same match) */
  let newPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  while (newPath.length) {
    // check whether next segment is a splat matched url
    if (newPath.startsWith('http')) {
      segments.push(newPath);
      newPath = '';
    } else {
      // grab next segment
      const part = newPath.split('/', 1)[0];
      segments.push(part);

      // remove segment + slash from path
      newPath = newPath.substr(part.length + 1);
    }
  }

  segments
    // reduce over the sections and find matches from `routes` prop
    .reduce((previous, current) => {
      // combine the last route section with the current
      // ex `pathname = /1/2/3 results in match checks for
      // `/1`, `/1/2`, `/1/2/3`
      const pathSection = !current ? '/' : `${previous}/${current}`;

      let breadcrumbMatch;

      routes.some(({ breadcrumb, matchOptions, path, getLocation }) => {
        if (!path) {
          throw new Error('withBreadcrumbs: `path` must be provided in every route object');
        }

        if (!breadcrumb) {
          return false;
        }

        const match = matchPath(pathSection, { ...(matchOptions || DEFAULT_MATCH_OPTIONS), path });

        // if a route match is found ^ break out of the loop with a rendered breadcumb
        // and match object to add to the `matches` array
        if (match) {
          breadcrumbMatch = {
            breadcrumb: renderer({ breadcrumb, match }),
            path,
            match,
            getLocation,
          };
          return true;
        }

        return false;
      });

      /* istanbul ignore else */
      if (breadcrumbMatch) {
        matches.push(breadcrumbMatch);
      }

      return pathSection === '/' ? '' : pathSection;
    }, null);

  return matches;
};

export const withBreadcrumbs = routes => Component => withRouter(props =>
  createElement(Component, {
    ...props,
    breadcrumbs: getBreadcrumbs({
      pathname: props.location.pathname,
      routes,
    }),
  }));
