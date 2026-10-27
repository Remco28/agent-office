
> build · deepseek-v4.1-flash-free
→ Read /home/frank/Projects/agent-office/src/scope.ts 
$ ls -la /home/frank/Projects/agent-office && ls -la /home/frank/Projects/agent-office/src
total 180
drwxr-xr-x 16 frank frank  4096 Oct 26 19:10 .
drwxr-xr-x 41 frank frank  4096 Oct 21 14:10 ..
drwxr-xr-x  2 frank frank  4096 Oct 19 16:36 .agents
-rw-r--r--  1 frank frank 17631 Oct 26 22:26 AGENTS.md
drwxr-xr-x  2 frank frank  4096 Sep 23 01:02 bin
-rw-r--r--  1 frank frank   105 Oct 12 14:29 bunfig.toml
-rw-r--r--  1 frank frank  1169 Sep 21 15:45 bun.lock
drwxr-xr-x  2 frank frank  4096 Oct 19 16:36 .claude
drwxr-xr-x  3 frank frank  4096 Oct 26 22:27 docs
drwx------  2 frank frank  4096 Sep 29 04:18 .freebuff
drwxr-xr-x  8 frank frank  4096 Oct 27 00:11 .git
-rw-r--r--  1 frank frank   149 Sep 29 04:26 .gitignore
drwxr-xr-x  3 frank frank  4096 Oct 26 12:00 human_feedback
-rwxr-xr-x  1 frank frank  7416 Sep 23 01:02 install.sh
-rw-r--r--  1 frank frank 44467 Sep 22 01:11 MULTI-AGENT-BOARD.md
drwxr-xr-x  7 frank frank  4096 Sep 21 15:45 node_modules
-rw-r--r--  1 frank frank   367 Sep 21 17:28 package.json
-rw-r--r--  1 frank frank 24160 Oct 26 22:26 README.md
drwxr-xr-x  4 frank frank  4096 Oct 26 22:31 review-loop
drwxr-xr-x  2 frank frank  4096 Sep  1 16:19 sidecar
drwxr-xr-x  6 frank frank  4096 Oct 26 12:00 skills
drwxr-xr-x  2 frank frank  4096 Oct 26 22:22 src
drwxr-xr-x  3 frank frank  4096 Oct 26 22:24 tests
-rw-r--r--  1 frank frank   272 Sep  1 16:19 tsconfig.json
drwxr-xr-x  6 frank frank  4096 Sep 23 22:30 .venv
total 224
drwxr-xr-x  2 frank frank  4096 Oct 26 22:22 .
drwxr-xr-x 16 frank frank  4096 Oct 26 19:10 ..
-rw-r--r--  1 frank frank 28054 Oct 26 22:23 cli.ts
-rw-r--r--  1 frank frank  4031 Oct 12 14:29 daemon.ts
-rw-r--r--  1 frank frank 10210 Oct 17 18:50 db.ts
-rw-r--r--  1 frank frank  6536 Oct 12 14:29 embed.ts
-rw-r--r--  1 frank frank   239 Sep  1 16:21 index.ts
-rw-r--r--  1 frank frank 14059 Oct 26 22:25 init.ts
-rw-r--r--  1 frank frank  6577 Oct 15 11:07 issues.ts
-rw-r--r--  1 frank frank 13943 Oct 26 12:00 memory.ts
-rw-r--r--  1 frank frank  3715 Oct 19 16:36 paths.ts
-rw-r--r--  1 frank frank 12409 Oct 26 22:25 scope.ts
-rw-r--r--  1 frank frank 15701 Oct 26 22:21 server.ts
-rw-r--r--  1 frank frank 30586 Oct 26 22:21 session.ts
-rw-r--r--  1 frank frank  3582 Oct 26 12:00 skill-search.ts
-rw-r--r--  1 frank frank  4393 Oct 19 16:36 skills.ts
-rw-r--r--  1 frank frank 11258 Sep 30 16:29 stats.ts
-rw-r--r--  1 frank frank  2598 Sep 21 17:16 tools.ts
-rw-r--r--  1 frank frank  8807 Sep 23 01:02 tui.ts
-rw-r--r--  1 frank frank 10938 Oct 17 18:50 work.ts
> build · deepseek-v4.1-flash-free
→ Read /home/frank/Projects/agent-office/src/init.ts 
> build · deepseek-v4.1-flash-free
$ cd /home/frank/Projects/agent-office && git rev-parse --path-format=absolute --show-toplevel --show-superproject-working-tree --git-common-dir | od -c | head -20; echo "exit=$?"; git rev-parse --local-env-vars
0000000   /   h   o   m   e   /   f   r   a   n   k   /   P   r   o   j
0000020   e   c   t   s   /   a   g   e   n   t   -   o   f   f   i   c
0000040   e  \n   /   h   o   m   e   /   f   r   a   n   k   /   P   r
0000060   o   j   e   c   t   s   /   a   g   e   n   t   -   o   f   f
0000100   i   c   e   /   .   g   i   t  \n
0000111
exit=0
GIT_ALTERNATE_OBJECT_DIRECTORIES
GIT_CONFIG
GIT_CONFIG_PARAMETERS
GIT_CONFIG_COUNT
GIT_OBJECT_DIRECTORY
GIT_DIR
GIT_WORK_TREE
GIT_IMPLICIT_WORK_TREE
GIT_GRAFT_FILE
GIT_INDEX_FILE
GIT_NO_REPLACE_OBJECTS
GIT_REPLACE_REF_BASE
GIT_PREFIX
GIT_SHALLOW_FILE
GIT_COMMON_DIR
$ cd /home/frank/Projects/agent-office && grep -rn --include='*.ts' -E 'spawnSync\(\["git"|"git",|`git |\bgit\b' src | head -80
src/skills.ts:8: * code, and git is what carries it to every computer. The office only reads
src/paths.ts:10: * The skills folder. It is in the checkout, not the data dir, because git is
src/paths.ts:96:  // outside the repo (and survive a `git clean -xfd`) without an env var.
src/scope.ts:9:  /** Canonical main repository root (resolves through git worktrees). */
src/scope.ts:13:  /** Absolute path to the shared .git directory. */
src/scope.ts:15:  /** Explicit project path recorded by `office init` in `.git/config`, if any. */
src/scope.ts:33: * A git repository whose top is the home folder is never a project. A dotfiles
src/scope.ts:48:/** How many git subprocesses this process has started; for tests of read cost. */
src/scope.ts:53:function git(args: string[]): { ok: boolean; out: string } {
src/scope.ts:55:  const proc = Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "pipe" });
src/scope.ts:60: * Fast walk up the directory tree to see if `.git` exists before spawning a
src/scope.ts:61: * git subprocess. Non-existent or non-git paths return false immediately.
src/scope.ts:67:    if (existsSync(join(current, ".git"))) return true;
src/scope.ts:75:  const result = git(["-C", dir, "config", "--local", "--get", "office.project"]);
src/scope.ts:81: * The one path every checkout of a repository shares, when its git folder is
src/scope.ts:82: * not the usual `<main checkout>/.git`. Git's own config says which layout it is:
src/scope.ts:85: * `--separate-git-dir` records nothing, so the git folder is the key. Each of
src/scope.ts:90:  const bare = git(["config", "--file", config, "--bool", "--get", "core.bare"]);
src/scope.ts:92:  const worktree = git(["config", "--file", config, "--get", "core.worktree"]);
src/scope.ts:100: * Inside a git worktree (such as one created by T3 Code), `--show-toplevel`
src/scope.ts:101: * returns the temporary worktree folder while `--git-common-dir` points back
src/scope.ts:102: * to the main repository's `.git` directory. Using `--git-common-dir` ensures
src/scope.ts:107:  const result = git([
src/scope.ts:113:    "--git-common-dir",
src/scope.ts:124:    basename(gitCommonDir) === ".git" ? clean(dirname(gitCommonDir)) : sharedRoot(gitCommonDir);
src/scope.ts:135: * office itself still uses `--project .` (unless working in a separate git
src/scope.ts:137: * Any other git repository or worktree resolves to its canonical project root.
src/scope.ts:153: * projects several times over, and each answer can cost a git subprocess, so
src/scope.ts:169: * A path that exists inside a git checkout — its top, any subfolder, or a
src/init.ts:42:1. Check in at the start of the session, from inside this repository (the project is taken from the folder, including any git worktree of it):
src/init.ts:135:      if (existsSync(join(child, ".git"))) found.push(child);
src/init.ts:144:/** Whether `dir` is inside a git repository's own data folder, or is a bare repository. */
src/init.ts:147:    ["git", "-C", dir, "rev-parse", "--is-inside-git-dir", "--is-bare-repository"],
src/init.ts:160: * never hides anything from git. What it leaves alone is said in `warnings`.
src/init.ts:163: * 1. Initializes a local Git repository if none exists yet (`git init`).
src/init.ts:164: * 2. Records `office.project = <canonicalRepoRoot>` in `.git/config` so the
src/init.ts:165: *    repo and all of its git worktrees resolve to the same project.
src/init.ts:214:      `${dir} is inside a git repository's own data folder (or a bare repository); ` +
src/init.ts:222:        `${dir} is inside a git repository at your home folder (${home}); Agent Office never ` +
src/init.ts:223:          `sets up the home folder. To make ${dir} its own project, run \`git init ${dir}\` first`,
src/init.ts:227:      `${dir} is inside the git repository ${enclosing.worktreeRoot}. To set up that ` +
src/init.ts:229:        `project, run \`git init ${dir}\` first`,
src/init.ts:237:        `${dir} holds other git repositories (${held.join(", ")}); a folder of projects is not ` +
src/init.ts:326:  let git = enclosing;
src/init.ts:327:  if (!git) {
src/init.ts:328:    const initProc = Bun.spawnSync(["git", "init", dir], {
src/init.ts:333:      const err = initProc.stderr.toString("utf8").trim() || "git init failed";
src/init.ts:334:      throw new Error(`could not initialize git repository in ${dir}: ${err}`);
src/init.ts:337:    actions.push("initialized git repository");
src/init.ts:338:    git = resolveGitProject(dir);
src/init.ts:339:    if (!git) {
src/init.ts:340:      throw new Error(`git repository initialized at ${dir}, but could not resolve git paths`);
src/init.ts:344:  const { repoRoot, linkedProject } = git;
src/init.ts:347:  // 1. Link git config `office.project` to the canonical repository root.
src/init.ts:350:      ["git", "-C", worktreeRoot, "config", "--local", "office.project", repoRoot],
src/init.ts:354:      const err = cfg.stderr.toString("utf8").trim() || "git config failed";
src/init.ts:355:      throw new Error(`could not record office.project in git config: ${err}`);
src/init.ts:357:    actions.push("linked git config to agent-office");
src/init.ts:387:  // init never edits .git/info/exclude: an ignore line it wrote could go on
src/init.ts:389:  // this machine's office checkout, so the user decides whether git sees them.
src/init.ts:391:    ? " The skills links point at this machine's office folder and show in `git status`; " +
src/cli.ts:136:                              local git repo if needed, links skills, adds the
src/cli.ts:143:                              git's config and never hides anything from git
> build · deepseek-v4.1-flash-free
→ Read /home/frank/Projects/agent-office/src/init.ts 
$ cd /home/frank/Projects/agent-office && git rev-parse --show-superproject-working-tree; echo "exit=$?"; git rev-parse --show-superproject-working-tree | od -c; git --version; find /home/frank/Projects -maxdepth 4 -name .gitmodules -print 2>/dev/null | head
exit=0
0000000
git version 2.55.0
> build · deepseek-v4.1-flash-free
$ cd /home/frank/Projects/agent-office/src && echo "normal:" && git rev-parse --show-toplevel && echo "ceiling:" && GIT_CEILING_DIRECTORIES=/home/frank/Projects/agent-office git rev-parse --show-toplevel; echo "ceiling exit=$?"
normal:
/home/frank/Projects/agent-office
ceiling:
fatal: not a git repository (or any of the parent directories): .git
ceiling exit=128
$ cd /tmp && echo "GIT_DIR:" && GIT_DIR=/home/frank/Projects/agent-office/.git git rev-parse --show-toplevel; echo "inject core.worktree:" && GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.worktree GIT_CONFIG_VALUE_0=/tmp git -C /home/frank/Projects/agent-office rev-parse --show-toplevel; echo "global core.worktree:" && GIT_CONFIG_GLOBAL=<(printf '[core]\n\tworktree = /tmp\n') git -C /home/frank/Projects/agent-office rev-parse --show-toplevel; echo "global core.bare:" && GIT_CONFIG_GLOBAL=<(printf '[core]\n\tbare = true\n') git -C /home/frank/Projects/agent-office rev-parse --show-toplevel; echo done
GIT_DIR:
/tmp
inject core.worktree:
/home/frank/Projects/agent-office
global core.worktree:
/home/frank/Projects/agent-office
global core.bare:
/home/frank/Projects/agent-office
done
> build · deepseek-v4.1-flash-free
$ find /home/frank -maxdepth 8 -type d -path '*/.git/modules/*' 2>/dev/null | head -20; echo "---worktrees-in-modules---"; find /home/frank -maxdepth 10 -type d -path '*/.git/modules/*/worktrees/*' 2>/dev/null | head -20; echo "---gitmodules---"; find /home/frank -maxdepth 8 -name .gitmodules 2>/dev/null | head -20
---worktrees-in-modules---
---gitmodules---
/home/frank/.hermes/lsp/node_modules/@mixmark-io/domino/.gitmodules
/home/frank/go/pkg/mod/honnef.co/go/tools@v0.7.0/.gitmodules
> build · deepseek-v4.1-flash-free
$ curl -L --max-time 20 -s https://raw.githubusercontent.com/git/git/v2.55.0/setup.c | grep -n -A80 'get_superproject_working_tree' | head -140
(no output)
> build · deepseek-v4.1-flash-free
$ curl -L --max-time 20 -s https://raw.githubusercontent.com/git/git/v2.55.0/setup.c -o /tmp/opencode/setup.c 2>/dev/null; wc -c /tmp/opencode/setup.c 2>/dev/null; grep -n -i 'superproject' /tmp/opencode/setup.c | head -20
81682 /tmp/opencode/setup.c
1522:	 * submodule, whose superproject is not a bare repository.
> build · deepseek-v4.1-flash-free
$ for f in submodule.c builtin/rev-parse.c environment.c; do echo "== $f"; curl -L --max-time 20 -s "https://raw.githubusercontent.com/git/git/v2.55.0/$f" | grep -n -i -A60 'superproject_working\|show-superproject\|superproject' | head -100; done
== submodule.c
791: * superproject commit that points to the submodule, but this is
792- * arbitrary - we can choose any (super_oid, path) that matches the
793- * submodule's name.
794- *
795- * NEEDSWORK: Storing an arbitrary commit is undesirable because we can't
796- * guarantee that we're reading the commit that the user would expect. A better
797- * scheme would be to just fetch a submodule by its name. This requires two
798- * steps:
799- * - Create a function that behaves like repo_submodule_init(), but accepts a
800- *   submodule name instead of treeish_name and path. This should be easy
801- *   because repo_submodule_init() internally uses the submodule's name.
802- *
803- * - Replace most instances of 'struct submodule' (which is the .gitmodules
804- *   config) with just the submodule name. This is OK because we expect
805- *   submodule settings to be stored in .git/config (via "git submodule init"),
806- *   not .gitmodules. This also lets us delete get_non_gitmodules_submodule(),
807- *   which constructs a bogus 'struct submodule' for the sake of giving a
808- *   placeholder name to a gitlink.
809- */
810-struct changed_submodule_data {
811-	/*
812:	 * The first superproject commit in the rev walk that points to
813-	 * the submodule.
814-	 */
815-	const struct object_id *super_oid;
816-	/*
817:	 * Path to the submodule in the superproject commit referenced
818-	 * by 'super_oid'.
819-	 */
820-	char *path;
821-	/* The submodule commits that have changed in the rev walk. */
822-	struct oid_array new_commits;
823-};
824-
825-static void changed_submodule_data_clear(struct changed_submodule_data *cs_data)
826-{
827-	oid_array_clear(&cs_data->new_commits);
828-	free(cs_data->path);
829-}
830-
831-static void collect_changed_submodules_cb(struct diff_queue_struct *q,
832-					  struct diff_options *options UNUSED,
833-					  void *data)
834-{
835-	struct collect_changed_submodules_cb_data *me = data;
836-	struct string_list *changed = me->changed;
837-	const struct object_id *commit_oid = me->commit_oid;
838-	int i;
839-
840-	for (i = 0; i < q->nr; i++) {
841-		struct diff_filepair *p = q->queue[i];
842-		const struct submodule *submodule;
843-		const char *name;
844-		struct string_list_item *item;
845-		struct changed_submodule_data *cs_data;
846-
847-		if (!S_ISGITLINK(p->two->mode))
848-			continue;
849-
850-		submodule = submodule_from_path(me->repo,
851-						commit_oid, p->two->path);
852-		if (submodule)
853-			name = submodule->name;
854-		else {
855-			name = default_name_or_path(p->two->path);
856-			/* make sure name does not collide with existing one */
857-			if (name)
858-				submodule = submodule_from_name(me->repo,
859-								commit_oid, name);
860-			if (submodule) {
861-				warning(_("Submodule in commit %s at path: "
862-					"'%s' collides with a submodule named "
863-					"the same. Skipping it."),
864-					oid_to_hex(commit_oid), p->two->path);
865-				name = NULL;
866-			}
867-		}
868-
869-		if (!name)
870-			continue;
871-
872-		item = string_list_insert(changed, name);
873-		if (item->util)
874-			cs_data = item->util;
875-		else {
876-			item->util = xcalloc(1, sizeof(struct changed_submodule_data));
877-			cs_data = item->util;
--
1138:		 * in order to be able to push the superproject).
1139-		 */
1140-		strvec_push(&cp.args, "--recurse-submodules=only-is-on-demand");
1141-		if (dry_run)
1142-			strvec_push(&cp.args, "--dry-run");
1143-
1144-		if (push_options && push_options->nr) {
1145-			const struct string_list_item *item;
1146-			for_each_string_list_item(item, push_options)
1147-				strvec_pushf(&cp.args, "--push-option=%s",
1148-					     item->string);
1149-		}
== builtin/rev-parse.c
1004:			if (!strcmp(arg, "--show-superproject-working-tree")) {
1005:				struct strbuf superproject = STRBUF_INIT;
1006:				if (get_superproject_working_tree(&superproject))
1007:					print_path(superproject.buf, prefix, format, DEFAULT_UNMODIFIED);
1008:				strbuf_release(&superproject);
1009-				continue;
1010-			}
1011-			if (!strcmp(arg, "--show-prefix")) {
1012-				if (prefix)
1013-					puts(prefix);
1014-				else
1015-					putchar('\n');
1016-				continue;
1017-			}
1018-			if (!strcmp(arg, "--show-cdup")) {
1019-				const char *pfx = prefix;
1020-				if (!is_inside_work_tree(the_repository)) {
1021-					const char *work_tree =
1022-						repo_get_work_tree(the_repository);
1023-					if (work_tree)
1024-						printf("%s\n", work_tree);
1025-					continue;
1026-				}
1027-				while (pfx) {
1028-					pfx = strchr(pfx, '/');
1029-					if (pfx) {
1030-						pfx++;
1031-						printf("../");
1032-					}
1033-				}
1034-				putchar('\n');
1035-				continue;
1036-			}
1037-			if (!strcmp(arg, "--git-dir") ||
1038-			    !strcmp(arg, "--absolute-git-dir")) {
1039-				const char *gitdir = getenv(GIT_DIR_ENVIRONMENT);
1040-				char *cwd;
1041-				int len;
1042-				enum format_type wanted = format;
1043-				if (arg[2] == 'g') {	/* --git-dir */
1044-					if (gitdir) {
1045-						print_path(gitdir, prefix, format, DEFAULT_UNMODIFIED);
1046-						continue;
1047-					}
1048-					if (!prefix) {
1049-						print_path(".git", prefix, format, DEFAULT_UNMODIFIED);
1050-						continue;
1051-					}
1052-				} else {		/* --absolute-git-dir */
1053-					wanted = FORMAT_CANONICAL;
1054-					if (!gitdir && !prefix)
1055-						gitdir = ".git";
1056-					if (gitdir) {
1057-						struct strbuf realpath = STRBUF_INIT;
1058-						strbuf_realpath(&realpath, gitdir, 1);
1059-						puts(realpath.buf);
1060-						strbuf_release(&realpath);
1061-						continue;
1062-					}
1063-				}
1064-				cwd = xgetcwd();
1065-				len = strlen(cwd);
1066-				strbuf_reset(&buf);
1067-				strbuf_addf(&buf, "%s%s.git", cwd, len && cwd[len-1] != '/' ? "/" : "");
1068-				free(cwd);
== environment.c
> build · deepseek-v4.1-flash-free
$ grep -n -i -B5 -A80 'get_superproject_working_tree' /tmp/opencode/setup.c | head -160
(no output)
> build · deepseek-v4.1-flash-free
$ for f in submodule.c submodule.h repository.c path.c dir.c; do echo "== $f"; curl -L --max-time 20 -s "https://raw.githubusercontent.com/git/git/v2.55.0/$f" | grep -n -i -B3 -A40 'get_superproject_working_tree' | head -80; done
== submodule.c
2610-	absorb_git_dir_into_superproject_recurse(path, super_prefix);
2611-}
2612-
2613:int get_superproject_working_tree(struct strbuf *buf)
2614-{
2615-	struct child_process cp = CHILD_PROCESS_INIT;
2616-	struct strbuf sb = STRBUF_INIT;
2617-	struct strbuf one_up = STRBUF_INIT;
2618-	char *cwd = xgetcwd();
2619-	int ret = 0;
2620-	const char *subpath;
2621-	int code;
2622-	ssize_t len;
2623-
2624-	if (!is_inside_work_tree(the_repository))
2625-		/*
2626-		 * FIXME:
2627-		 * We might have a superproject, but it is harder
2628-		 * to determine.
2629-		 */
2630-		return 0;
2631-
2632-	if (!strbuf_realpath(&one_up, "../", 0))
2633-		return 0;
2634-
2635-	subpath = relative_path(cwd, one_up.buf, &sb);
2636-	strbuf_release(&one_up);
2637-
2638-	prepare_submodule_repo_env(&cp.env);
2639-	strvec_pop(&cp.env);
2640-
2641-	strvec_pushl(&cp.args, "--literal-pathspecs", "-C", "..",
2642-		     "ls-files", "-z", "--stage", "--full-name", "--",
2643-		     subpath, NULL);
2644-	strbuf_reset(&sb);
2645-
2646-	cp.no_stdin = 1;
2647-	cp.no_stderr = 1;
2648-	cp.out = -1;
2649-	cp.git_cmd = 1;
2650-
2651-	if (start_command(&cp))
2652-		die(_("could not start ls-files in .."));
2653-
== submodule.h
170- * project is a submodule of. If this repository is not a submodule of
171- * another repository, return 0.
172- */
173:int get_superproject_working_tree(struct strbuf *buf);
174-
175-#endif
== repository.c
== path.c
== dir.c
> build · deepseek-v4.1-flash-free
$ curl -L --max-time 20 -s https://raw.githubusercontent.com/git/git/v2.55.0/submodule.c | sed -n '2613,2735p'
int get_superproject_working_tree(struct strbuf *buf)
{
	struct child_process cp = CHILD_PROCESS_INIT;
	struct strbuf sb = STRBUF_INIT;
	struct strbuf one_up = STRBUF_INIT;
	char *cwd = xgetcwd();
	int ret = 0;
	const char *subpath;
	int code;
	ssize_t len;

	if (!is_inside_work_tree(the_repository))
		/*
		 * FIXME:
		 * We might have a superproject, but it is harder
		 * to determine.
		 */
		return 0;

	if (!strbuf_realpath(&one_up, "../", 0))
		return 0;

	subpath = relative_path(cwd, one_up.buf, &sb);
	strbuf_release(&one_up);

	prepare_submodule_repo_env(&cp.env);
	strvec_pop(&cp.env);

	strvec_pushl(&cp.args, "--literal-pathspecs", "-C", "..",
		     "ls-files", "-z", "--stage", "--full-name", "--",
		     subpath, NULL);
	strbuf_reset(&sb);

	cp.no_stdin = 1;
	cp.no_stderr = 1;
	cp.out = -1;
	cp.git_cmd = 1;

	if (start_command(&cp))
		die(_("could not start ls-files in .."));

	len = strbuf_read(&sb, cp.out, PATH_MAX);
	close(cp.out);

	if (starts_with(sb.buf, "160000")) {
		int super_sub_len;
		int cwd_len = strlen(cwd);
		char *super_sub, *super_wt;

		/*
		 * There is a superproject having this repo as a submodule.
		 * The format is <mode> SP <hash> SP <stage> TAB <full name> \0,
		 * We're only interested in the name after the tab.
		 */
		super_sub = strchr(sb.buf, '\t') + 1;
		super_sub_len = strlen(super_sub);

		if (super_sub_len > cwd_len ||
		    strcmp(&cwd[cwd_len - super_sub_len], super_sub))
			BUG("returned path string doesn't match cwd?");

		super_wt = xstrdup(cwd);
		super_wt[cwd_len - super_sub_len] = '\0';

		strbuf_realpath(buf, super_wt, 1);
		ret = 1;
		free(super_wt);
	}
	free(cwd);
	strbuf_release(&sb);

	code = finish_command(&cp);

	if (code == 128)
		/* '../' is not a git repository */
		return 0;
	if (code == 0 && len == 0)
		/* There is an unrelated git repository at '../' */
		return 0;
	if (code)
		die(_("ls-tree returned unexpected return code %d"), code);

	return ret;
}

/*
 * Put the gitdir for a submodule (given relative to the main
 * repository worktree) into `buf`, or return -1 on error.
 */
int submodule_to_gitdir(struct repository *repo,
			struct strbuf *buf, const char *submodule)
{
	const struct submodule *sub;
	const char *git_dir;
	int ret = 0;

	if (validate_submodule_path(submodule) < 0)
		exit(128);

	strbuf_reset(buf);
	strbuf_addstr(buf, submodule);
	strbuf_complete(buf, '/');
	strbuf_addstr(buf, ".git");

	git_dir = read_gitfile(buf->buf);
	if (git_dir) {
		strbuf_reset(buf);
		strbuf_addstr(buf, git_dir);
	}
	if (!is_git_directory(buf->buf)) {
		sub = submodule_from_path(repo, null_oid(the_hash_algo), submodule);
		if (!sub) {
			ret = -1;
			goto cleanup;
		}
		strbuf_reset(buf);
		submodule_name_to_gitdir(buf, repo, sub->name);
	}

cleanup:
	return ret;
}
> build · deepseek-v4.1-flash-free
$ for f in t/t1500-rev-parse.sh t/t7400-submodule-basic.sh t/t7412-submodule-absorbgitdirs.sh; do echo "== $f"; curl -L --max-time 20 -s "https://raw.githubusercontent.com/git/git/v2.55.0/$f" | grep -n -B8 -A25 'show-superproject' | head -80; done
== t/t1500-rev-parse.sh
264-	test_cmp expect actual
265-'
266-
267-test_expect_success '--show-toplevel from inside .git' '
268-	test_must_fail git -C .git rev-parse --show-toplevel
269-'
270-
271-test_expect_success 'showing the superproject correctly' '
272:	git rev-parse --show-superproject-working-tree >out &&
273-	test_must_be_empty out &&
274-
275-	test_create_repo super &&
276-	test_commit -C super test_commit &&
277-	test_create_repo sub &&
278-	test_commit -C sub test_commit &&
279-	git -c protocol.file.allow=always \
280-		-C super submodule add ../sub dir/sub &&
281-	echo $(pwd)/super >expect  &&
282:	git -C super/dir/sub rev-parse --show-superproject-working-tree >out &&
283-	test_cmp expect out &&
284-
285-	test_commit -C super submodule_add &&
286-	git -C super checkout -b branch1 &&
287-	git -C super/dir/sub checkout -b branch1 &&
288-	test_commit -C super/dir/sub branch1_commit &&
289-	git -C super add dir/sub &&
290-	test_commit -C super branch1_commit &&
291-	git -C super checkout -b branch2 main &&
292-	git -C super/dir/sub checkout -b branch2 main &&
293-	test_commit -C super/dir/sub branch2_commit &&
294-	git -C super add dir/sub &&
295-	test_commit -C super branch2_commit &&
296-	test_must_fail git -C super merge branch1 &&
297-
298:	git -C super/dir/sub rev-parse --show-superproject-working-tree >out &&
299-	test_cmp expect out
300-'
301-
302-# at least one external project depends on this behavior:
303-test_expect_success 'rev-parse --since= unsqueezed ordering' '
304-	x1=--since=1970-01-01T00:00:01Z &&
305-	x2=--since=1970-01-01T00:00:02Z &&
306-	x3=--since=1970-01-01T00:00:03Z &&
307-	git rev-parse $x1 $x1 $x3 $x2 >actual &&
308-	cat >expect <<-EOF &&
309-	--max-age=1
310-	--max-age=1
311-	--max-age=3
312-	--max-age=2
313-	EOF
314-	test_cmp expect actual
315-'
316-
317-test_expect_success 'rev-parse --bisect includes bad, excludes good' '
318-	test_commit_bulk 6 &&
319-
320-	git update-ref refs/bisect/bad-1 HEAD~1 &&
321-	git update-ref refs/bisect/b HEAD~2 &&
322-	git update-ref refs/bisect/bad-3 HEAD~3 &&
323-	git update-ref refs/bisect/good-3 HEAD~3 &&
== t/t7400-submodule-basic.sh
== t/t7412-submodule-absorbgitdirs.sh
> build · deepseek-v4.1-flash-free
$ curl -L --max-time 20 -s https://raw.githubusercontent.com/git/git/master/submodule.c | grep -n -A50 'int get_superproject_working_tree' | head -70
2613:int get_superproject_working_tree(struct strbuf *buf)
2614-{
2615-	struct child_process cp = CHILD_PROCESS_INIT;
2616-	struct strbuf sb = STRBUF_INIT;
2617-	struct strbuf one_up = STRBUF_INIT;
2618-	char *cwd = xgetcwd();
2619-	int ret = 0;
2620-	const char *subpath;
2621-	int code;
2622-	ssize_t len;
2623-
2624-	if (!is_inside_work_tree(the_repository))
2625-		/*
2626-		 * FIXME:
2627-		 * We might have a superproject, but it is harder
2628-		 * to determine.
2629-		 */
2630-		goto out;
2631-
2632-	if (!strbuf_realpath(&one_up, "../", 0))
2633-		goto out;
2634-
2635-	subpath = relative_path(cwd, one_up.buf, &sb);
2636-
2637-	prepare_submodule_repo_env(&cp.env);
2638-	strvec_pop(&cp.env);
2639-
2640-	strvec_pushl(&cp.args, "--literal-pathspecs", "-C", "..",
2641-		     "ls-files", "-z", "--stage", "--full-name", "--",
2642-		     subpath, NULL);
2643-	strbuf_reset(&sb);
2644-
2645-	cp.no_stdin = 1;
2646-	cp.no_stderr = 1;
2647-	cp.out = -1;
2648-	cp.git_cmd = 1;
2649-
2650-	if (start_command(&cp))
2651-		die(_("could not start ls-files in .."));
2652-
2653-	len = strbuf_read(&sb, cp.out, PATH_MAX);
2654-	close(cp.out);
2655-
2656-	if (starts_with(sb.buf, "160000")) {
2657-		int super_sub_len;
2658-		int cwd_len = strlen(cwd);
2659-		char *super_sub, *super_wt;
2660-
2661-		/*
2662-		 * There is a superproject having this repo as a submodule.
2663-		 * The format is <mode> SP <hash> SP <stage> TAB <full name> \0,
> build · deepseek-v4.1-flash-free
$ cd /home/frank/Projects/agent-office && echo "root, ceiling=root:" && GIT_CEILING_DIRECTORIES=/home/frank/Projects/agent-office git rev-parse --show-toplevel; echo "root, ceiling=parent:" && GIT_CEILING_DIRECTORIES=/home/frank/Projects git rev-parse --show-toplevel; cd src && echo "sub, ceiling=parent:" && GIT_CEILING_DIRECTORIES=/home/frank/Projects git rev-parse --show-toplevel; echo "sub, ceiling=root:" && GIT_CEILING_DIRECTORIES=/home/frank/Projects/agent-office git rev-parse --show-toplevel; echo "sub, ceiling=src:" && GIT_CEILING_DIRECTORIES=/home/frank/Projects/agent-office/src git rev-parse --show-toplevel; echo done
root, ceiling=root:
/home/frank/Projects/agent-office
root, ceiling=parent:
/home/frank/Projects/agent-office
sub, ceiling=parent:
/home/frank/Projects/agent-office
sub, ceiling=root:
fatal: not a git repository (or any of the parent directories): .git
sub, ceiling=src:
/home/frank/Projects/agent-office
done
> build · deepseek-v4.1-flash-free
$ cd /home/frank/Projects/agent-office && grep -rn --include='*.ts' -E 'Bun\.spawn|spawnSync|execFile|child_process' src | head -50
src/daemon.ts:75:  const child = Bun.spawn({
src/scope.ts:55:  const proc = Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "pipe" });
src/embed.ts:60:    proc = Bun.spawn({
src/init.ts:146:  const proc = Bun.spawnSync(
src/init.ts:328:    const initProc = Bun.spawnSync(["git", "init", dir], {
src/init.ts:349:    const cfg = Bun.spawnSync(
> build · deepseek-v4.1-flash-free
$ cd /home/frank/Projects/agent-office && grep -rn --include='*.ts' -E 'linkedProject|office\.project|readGitConfigProject' src tests | head -40
src/scope.ts:16:  linkedProject: string | null;
src/scope.ts:74:function readGitConfigProject(dir: string): string | null {
src/scope.ts:75:  const result = git(["-C", dir, "config", "--local", "--get", "office.project"]);
src/scope.ts:125:  const linkedProject = readGitConfigProject(dir);
src/scope.ts:126:  return { repoRoot, worktreeRoot, gitCommonDir, linkedProject };
src/scope.ts:143:  const canonical = info.linkedProject ?? info.repoRoot;
src/scope.ts:190:  const canonical = info ? (info.linkedProject ?? info.repoRoot) : null;
src/init.ts:164: * 2. Records `office.project = <canonicalRepoRoot>` in `.git/config` so the
src/init.ts:344:  const { repoRoot, linkedProject } = git;
src/init.ts:347:  // 1. Link git config `office.project` to the canonical repository root.
src/init.ts:348:  if (linkedProject !== repoRoot) {
src/init.ts:350:      ["git", "-C", worktreeRoot, "config", "--local", "office.project", repoRoot],
src/init.ts:355:      throw new Error(`could not record office.project in git config: ${err}`);
tests/init.test.ts:39:    expect(gitInfo?.linkedProject).toBe(projectDir);
> build · deepseek-v4.1-flash-free
$ cd /home/frank/Projects/agent-office && ls tests && grep -rn --include='*.test.ts' -E 'submodule|superproject|worktree|office\.project|symlink|GIT_DIR|CEILING|claude.*agents|agents.*claude' tests | head -60
cli.test.ts
fixtures
helpers.ts
init-safety.test.ts
init.test.ts
issues.test.ts
memory.test.ts
migration.test.ts
paths.test.ts
project-scope.test.ts
retrieval.test.ts
review.test.ts
scope.test.ts
session.test.ts
skill-search.test.ts
skills.test.ts
stats.test.ts
tools.test.ts
work.test.ts
tests/work.test.ts:114:    noteWork(db, item.id, { text: "built in a worktree", author: "opencode" });
tests/work.test.ts:117:    expect(open.last_note).toBe("built in a worktree");
tests/init-safety.test.ts:11:  symlinkSync,
tests/init-safety.test.ts:85:  test("from a worktree's subfolder, the refusal names that worktree, not the main checkout", () => {
tests/init-safety.test.ts:88:    git(main, "worktree", "add", "-q", "-b", "feat", wt);
tests/init-safety.test.ts:138:    symlinkSync(shared, join(app, "AGENTS.md"));
tests/init-safety.test.ts:147:    symlinkSync(join(root, "missing.md"), join(app, "AGENTS.md"));
tests/init-safety.test.ts:156:    symlinkSync(officeAgents, join(app, "AGENTS.md"));
tests/init-safety.test.ts:157:    symlinkSync(officeAgents, join(app, "CLAUDE.md"));
tests/init-safety.test.ts:168:    symlinkSync(outside, join(app, ".claude"));
tests/init-safety.test.ts:199:  test("a .claude that links to .agents gets one skills link, and init finishes", () => {
tests/init-safety.test.ts:202:    symlinkSync(".agents", join(app, ".claude"));
tests/init-safety.test.ts:216:  test("GIT_DIR in the shell does not send init into another repository", () => {
tests/init-safety.test.ts:228:        env: { ...process.env, GIT_DIR: join(other, ".git"), GIT_WORK_TREE: other },
tests/init-safety.test.ts:249:  test("a submodule of the repository does not count as a repository it holds", () => {
tests/init-safety.test.ts:252:    git(app, "-c", "protocol.file.allow=always", "submodule", "add", "-q", lib, "vendor/lib");
tests/init-safety.test.ts:281:    expect(result.worktree).toBe(join(process.env.HOME!, "newapp"));
tests/init-safety.test.ts:285:  test("run in a worktree, the message names the worktree it wrote to", () => {
tests/init-safety.test.ts:288:    git(main, "worktree", "add", "-q", "-b", "feat", wt);
tests/init.test.ts:11:describe("office init and git/worktree project detection", () => {
tests/init.test.ts:41:    // Verify skill symlinks and CLAUDE.md -> AGENTS.md
tests/init.test.ts:80:  test("resolves git worktrees (such as T3 Code worktrees) back to the main project repository", async () => {
tests/init.test.ts:84:    // Create an initial commit so we can add a git worktree
tests/init.test.ts:90:    const worktreeDir = join(tempRoot, "t3-worktree-feature-1");
tests/init.test.ts:91:    const wt = Bun.spawnSync(["git", "-C", mainRepo, "worktree", "add", "-b", "feat-1", worktreeDir], {
tests/init.test.ts:97:    // Both detectCwdProject and normalizeProject resolve the worktree back to mainRepo
tests/init.test.ts:98:    mkdirSync(join(worktreeDir, "subdir"), { recursive: true });
tests/init.test.ts:99:    expect(detectCwdProject(worktreeDir)).toBe(mainRepo);
tests/init.test.ts:100:    expect(detectCwdProject(join(worktreeDir, "subdir"))).toBe(mainRepo);
tests/init.test.ts:101:    expect(normalizeProject(worktreeDir)).toBe(mainRepo);
tests/init.test.ts:103:    // Test end-to-end CLI running inside the worktree without --project
tests/init.test.ts:126:          cwd: worktreeDir,
tests/init.test.ts:140:      // 1. Begin inside the worktree with no --project flag
tests/init.test.ts:149:      // 2. Remember a fact from inside the worktree
tests/init.test.ts:153:      // 3. Query context from inside the worktree without --by or --project
tests/project-scope.test.ts:2:import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
tests/project-scope.test.ts:25:/** A repository with one commit, so worktrees and submodules can be made from it. */
tests/project-scope.test.ts:101:  test("a subfolder or a symlink names the same project as the repository", () => {
tests/project-scope.test.ts:104:    symlinkSync(alpha, join(root, "alpha-link"));
tests/project-scope.test.ts:126:  test("bare-repository worktrees share one project", () => {
tests/project-scope.test.ts:130:    git(bare, "worktree", "add", "-q", join(root, "wt-main"), "HEAD");
tests/project-scope.test.ts:131:    git(bare, "worktree", "add", "-q", "-b", "feat", join(root, "wt-feat"));
tests/project-scope.test.ts:136:  test("a --separate-git-dir checkout and its worktree share one project", () => {
tests/project-scope.test.ts:143:    git(work, "worktree", "add", "-q", "-b", "feat", join(root, "sep-wt"));
tests/project-scope.test.ts:149:  test("a submodule is its own project, at its own folder", () => {
tests/project-scope.test.ts:152:    git(sup, "submodule", "add", "-q", lib, "sub");
tests/project-scope.test.ts:183:  test("a submodule in a worktree of its superproject is the same project as in the main checkout", () => {
tests/project-scope.test.ts:186:    git(sup, "submodule", "add", "-q", lib, "sub");
tests/project-scope.test.ts:189:    git(sup, "worktree", "add", "-q", "-b", "feat", wt);
tests/project-scope.test.ts:190:    git(wt, "submodule", "update", "--init", "-q");
tests/project-scope.test.ts:195:  test("GIT_DIR and friends in the shell do not move the folder to another repository", () => {
tests/project-scope.test.ts:207:        env: { ...process.env, GIT_DIR: join(other, ".git"), GIT_WORK_TREE: other },
> build · deepseek-v4.1-flash-free
→ Read /home/frank/Projects/agent-office/tests/project-scope.test.ts [offset=90, limit=140]
→ Read /home/frank/Projects/agent-office/tests/init-safety.test.ts [offset=180, limit=130]
> build · deepseek-v4.1-flash-free
